"use strict";

const { mkdir, writeFile } = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");
const { isCloudinaryConfigured, uploadBufferToCloudinary, destroyCloudinaryBySecureUrl } = require("./cloudinary-platform");

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extForMime(mime) {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  return ".gif";
}

async function writePlatformUploadImage(accountId, fileBuffer, mime, size, maxBytes) {
  if (!fileBuffer || size === 0) {
    return { ok: false, error: "empty" };
  }
  if (size > maxBytes) {
    return { ok: false, error: "Файл хэт том байна." };
  }
  if (!ALLOWED.has(mime)) {
    return { ok: false, error: "Зөвхөн JPG, PNG, WebP, GIF зөвшөөрнө." };
  }

  if (isCloudinaryConfigured()) {
    try {
      const folder = `busy/platform/${accountId.toString()}`;
      const { secure_url } = await uploadBufferToCloudinary({ folder, mime, buffer: fileBuffer });
      return { ok: true, url: secure_url };
    } catch (e) {
      console.error("[writePlatformUploadImage] Cloudinary", e);
      return { ok: false, error: "Зургийг Cloudinary руу илгээхэд алдаа гарлаа." };
    }
  }

  const dir = path.join(process.cwd(), "public", "uploads", "platform", accountId.toString());
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${randomUUID().slice(0, 10)}${extForMime(mime)}`;
  await writeFile(path.join(dir, name), fileBuffer);
  const url = `/uploads/platform/${accountId.toString()}/${name}`;
  return { ok: true, url };
}

module.exports = {
  writePlatformUploadImage,
  destroyCloudinaryBySecureUrl,
};
