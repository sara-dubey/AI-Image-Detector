// backend/src/convertRoutes.js
import express from "express";
import multer from "multer";
import { UPLOAD_LIMIT_BYTES } from "./config.js";
import { imagesToPdfBuffer } from "./imageToPdf.js";
import { pdfToImagesZipBuffer } from "./pdfToImage.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: UPLOAD_LIMIT_BYTES },
});

// POST /api/convert/images-to-pdf
// form-data: images=<file> (multiple)
router.post("/convert/images-to-pdf", upload.array("images", 50), async (req, res) => {
  try {
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ error: "Missing images. Use form field name: images" });
    }

    const pdfBuf = await imagesToPdfBuffer(files);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="output.pdf"`);
    return res.status(200).send(pdfBuf);
  } catch (e) {
    return res.status(500).json({
      error: "Images to PDF failed",
      details: e?.message ? String(e.message) : String(e),
    });
  }
});

// POST /api/convert/pdf-to-images
// form-data: pdf=<file>
// optional: format=png|jpeg, dpi=150
router.post("/convert/pdf-to-images", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: "Missing pdf. Use form field name: pdf" });
    }

    const format = String(req.body.format || "png").toLowerCase(); // png|jpeg
    const dpi = Number(req.body.dpi || 150);

    const zipBuf = await pdfToImagesZipBuffer({
      pdfBuffer: req.file.buffer,
      format,
      dpi,
    });

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="output.zip"`);
    return res.status(200).send(zipBuf);
  } catch (e) {
    return res.status(500).json({
      error: "PDF to images failed",
      details: e?.message ? String(e.message) : String(e),
    });
  }
});

export default router;
