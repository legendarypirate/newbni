"use strict";

const { writePlatformUploadImage } = require("../../lib/platform-write-image");

const MAX_BYTES = 10 * 1024 * 1024;

async function uploadOne(req, res) {
  const accountId = req.user?.id;
  const file = req.file;
  if (!accountId) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }
  if (!file) {
    return res.status(400).json({ ok: false, error: "file_required" });
  }

  try {
    const up = await writePlatformUploadImage(
      accountId,
      file.buffer,
      file.mimetype,
      file.size,
      MAX_BYTES,
      file.originalname,
    );
    if (!up.ok || !up.url) {
      const err = up.error || "upload_failed";
      const status = err === "too_large" || err === "invalid_type" ? 400 : 500;
      return res.status(status).json({ ok: false, error: err });
    }
    return res.json({ ok: true, url: up.url });
  } catch (err) {
    console.error("Upload image failed:", err);
    return res.status(500).json({ ok: false, error: "upload_failed" });
  }
}

exports.uploadEventDetailHero = uploadOne;
exports.uploadEventSpeakerPhoto = uploadOne;
exports.uploadTripItineraryDayBanner = uploadOne;
exports.uploadNewsCover = uploadOne;
exports.uploadProfileImage = uploadOne;

