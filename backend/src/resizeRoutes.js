// backend/src/resizeRoutes.js
import express from "express";
import multer from "multer";
import {
  resizeByDims,
  compressToTargetMB,
  pickOutputFormatFromOutFormat,
  coerceKeepAspect,
  coerceFit,
  safeInt,
  safeFloat,
} from "./imageResize.js";
import { UPLOAD_LIMIT_BYTES } from "./config.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: UPLOAD_LIMIT_BYTES },
});

// -------------------------------
// POST /api/resize
// form-data:
// image=<file>
// width, height (optional)
// fit=contain|cover|fill
// quality=10..95
// outFormat=keep|png|jpeg|webp
// keepAspect="1"|"0"
// -------------------------------
router.post("/resize", upload.single("image"), async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: "Missing image file field: image" });
    }

    // width/height may be blank or missing
    const widthRaw = req.body.width;
    const heightRaw = req.body.height;

    const width =
      widthRaw === undefined || widthRaw === "" ? null : safeInt(widthRaw, null, 1, 12000);
    const height =
      heightRaw === undefined || heightRaw === "" ? null : safeInt(heightRaw, null, 1, 12000);

    const quality = safeInt(req.body.quality, 85, 10, 95);

    const keepAspect = coerceKeepAspect(req.body.keepAspect, true);
    const fit = coerceFit(req.body.fit, "contain", keepAspect);

    const { fmt, mime, ext } = pickOutputFormatFromOutFormat({
      outFormat: req.body.outFormat,
      inputMime: req.file.mimetype,
    });

    const out = await resizeByDims({
      inputBuffer: req.file.buffer,
      width,
      height,
      fit,
      keepAspect,
      format: fmt,
      quality,
    });

    res.setHeader("Content-Type", mime);
    res.setHeader("Content-Disposition", `inline; filename="rivel-resized.${ext}"`);
    res.setHeader("X-Image-Width", String(out.info.width));
    res.setHeader("X-Image-Height", String(out.info.height));
    res.setHeader("X-Image-Bytes", String(out.info.bytes));
    res.setHeader("X-Image-Format", String(out.info.format));

    return res.status(200).send(out.buffer);
  } catch (e) {
    return res.status(500).json({
      error: "Resize failed",
      details: e?.message ? String(e.message) : String(e),
    });
  }
});

// -------------------------------
// POST /api/resize/compress   ✅ matches your frontend
// form-data:
// image=<file>
// targetMB
// minQuality
// maxQuality
// outFormat
// -------------------------------
router.post("/resize/compress", upload.single("image"), async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: "Missing image file field: image" });
    }

    const targetMB = safeFloat(req.body.targetMB, 1.0, 0.05, 50);
    const minQuality = safeInt(req.body.minQuality, 35, 5, 95);
    const maxQuality = safeInt(req.body.maxQuality, 92, 10, 95);

    const { fmt, mime, ext } = pickOutputFormatFromOutFormat({
      outFormat: req.body.outFormat,
      inputMime: req.file.mimetype,
    });

    const out = await compressToTargetMB({
      inputBuffer: req.file.buffer,
      targetMB,
      minQuality,
      maxQuality,
      format: fmt,
    });

    res.setHeader("Content-Type", mime);
    res.setHeader("Content-Disposition", `inline; filename="rivel-compressed.${ext}"`);
    res.setHeader("X-Image-Width", String(out.info.width));
    res.setHeader("X-Image-Height", String(out.info.height));
    res.setHeader("X-Image-Bytes", String(out.info.bytes));
    res.setHeader("X-Image-Format", String(out.info.format));
    if (out.info.qualityUsed != null) res.setHeader("X-Quality-Used", String(out.info.qualityUsed));

    return res.status(200).send(out.buffer);
  } catch (e) {
    return res.status(500).json({
      error: "Compress failed",
      details: e?.message ? String(e.message) : String(e),
    });
  }
});

export default router;
