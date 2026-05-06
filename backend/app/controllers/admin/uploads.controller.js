"use strict";

const { writePlatformUploadImage } = require("../../lib/platform-write-image");

const MAX_BYTES = 8 * 1024 * 1024;

exports.uploadMarketingListingHero = async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }

  const files = Array.isArray(req.files) ? req.files : [];
  if (files.length === 0) {
    return res.status(400).json({ ok: false, error: "no_files" });
  }

  const urls = [];
  const partialErrors = [];
  for (const file of files) {
    try {
      const up = await writePlatformUploadImage(
        req.user.id,
        file.buffer,
        file.mimetype,
        file.size,
        MAX_BYTES,
      );
      if (up.ok && up.url) {
        urls.push(up.url);
      } else {
        partialErrors.push(`${file.originalname}: ${up.error || "upload_failed"}`);
      }
    } catch (err) {
      partialErrors.push(`${file.originalname}: upload_failed`);
      console.error("uploadMarketingListingHero file failed:", err);
    }
  }

  if (urls.length === 0) {
    return res.status(400).json({ ok: false, error: partialErrors.join(" · ") || "upload_failed" });
  }

  return res.json({
    ok: true,
    urls,
    ...(partialErrors.length ? { partialErrors } : {}),
  });
};

