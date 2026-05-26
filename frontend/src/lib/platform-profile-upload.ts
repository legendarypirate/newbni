import "server-only";

import { writePlatformUploadImage } from "@/lib/platform-write-image";
import { serverAuthedFetch } from "@/lib/server-authed-fetch";

export function isFormUploadFile(value: unknown): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    typeof (value as File).arrayBuffer === "function" &&
    "size" in value &&
    typeof (value as File).size === "number"
  );
}

function mapUploadError(raw: unknown): string {
  const key = String(raw ?? "").trim();
  if (!key || key === "empty" || key === "file_required") return "";
  if (key === "invalid_type") return "Зөвхөн JPG, PNG, WebP, GIF зөвшөөрнө.";
  if (key === "too_large") return "Файл хэт том байна.";
  if (key === "upload_failed" || key === "cloudinary_failed") {
    return "Зургийг Cloudinary руу илгээхэд алдаа гарлаа.";
  }
  return key;
}

type AuthedOpts = { bearerToken?: string | null };

/**
 * Profile / hero images: upload via backend API (uses backend `CLOUDINARY_*` env),
 * then fall back to Next.js local disk / frontend Cloudinary env.
 */
export async function uploadPlatformProfileImage(
  accountId: bigint,
  file: unknown,
  maxBytes: number,
  authed: AuthedOpts,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!isFormUploadFile(file) || file.size === 0) {
    return { ok: false, error: "empty" };
  }
  if (file.size > maxBytes) {
    return { ok: false, error: "Файл хэт том байна." };
  }

  const body = new FormData();
  body.append("file", file, file.name || "upload.jpg");

  try {
    const res = await serverAuthedFetch("/platform/profile-image-upload", { method: "POST", body }, authed);
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string };
    if (res.ok && json.ok && typeof json.url === "string" && json.url.trim()) {
      return { ok: true, url: json.url.trim() };
    }
    const mapped = mapUploadError(json.error);
    if (mapped && res.status !== 404) {
      return { ok: false, error: mapped };
    }
  } catch (e) {
    console.error("[uploadPlatformProfileImage] backend API failed, using local fallback", e);
  }

  return writePlatformUploadImage(accountId, file, maxBytes);
}
