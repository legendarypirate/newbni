"use strict";

const { mkdir, writeFile } = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");
const { isCloudinaryConfigured, uploadBufferToCloudinary, destroyCloudinaryBySecureUrl } = require("./cloudinary-platform");

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function resolveImageMime(mimetype, originalname) {
  const m = String(mimetype || "").trim().toLowerCase();
  if (ALLOWED.has(m)) return m;
  if (m === "image/jpg") return "image/jpeg";
  const ext = path.extname(String(originalname || "")).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return m;
}

function extForMime(mime) {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  return ".gif";
}

async function writePlatformUploadImage(accountId, fileBuffer, mime, size, maxBytes, originalname) {
  if (!fileBuffer || size === 0) {
    return { ok: false, error: "empty" };
  }
  if (size > maxBytes) {
    return { ok: false, error: "too_large" };
  }
  const resolvedMime = resolveImageMime(mime, originalname);
  if (!ALLOWED.has(resolvedMime)) {
    return { ok: false, error: "invalid_type" };
  }

  if (isCloudinaryConfigured()) {
    try {
      const folder = `busy/platform/${accountId.toString()}`;
      const { secure_url } = await uploadBufferToCloudinary({ folder, mime: resolvedMime, buffer: fileBuffer });
      return { ok: true, url: secure_url };
    } catch (e) {
      console.error("[writePlatformUploadImage] Cloudinary", e);
      return { ok: false, error: "Зургийг Cloudinary руу илгээхэд алдаа гарлаа." };
    }
  }

  const dir = path.join(process.cwd(), "public", "uploads", "platform", accountId.toString());
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${randomUUID().slice(0, 10)}${extForMime(resolvedMime)}`;
  await writeFile(path.join(dir, name), fileBuffer);
  const url = `/uploads/platform/${accountId.toString()}/${name}`;
  return { ok: true, url };
}

module.exports = {
  writePlatformUploadImage,
  destroyCloudinaryBySecureUrl,
};
