import express from "express";
import multer from "multer";
import crypto from "crypto";
import { hfDetect } from "./hfDetect.js";
import { UPLOAD_LIMIT_BYTES } from "./config.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: UPLOAD_LIMIT_BYTES || 8 * 1024 * 1024 }, // fallback 8MB
});

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

// POST /api/detect
// form-data field name: image
router.post("/detect", upload.single("image"), async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({
        ok: false,
        error: "Missing image. Please upload using form-data field name: image",
      });
    }

    const cache = req.app.locals.detectCache; // set in server.js
    const key = sha256(req.file.buffer);

    if (cache) {
      const cached = cache.get(key);
      if (cached) {
        res.setHeader("X-Cache", "HIT");
        return res.json(cached);
      }
    }

    const out = await hfDetect({
      imageBuffer: req.file.buffer,
      mime: req.file.mimetype,
    });

    if (cache) {
      cache.set(key, out);
      res.setHeader("X-Cache", "MISS");
    }

    return res.json(out);
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: "Detect failed",
      details: e?.message ? String(e.message) : String(e),
    });
  }
});

export default router;
