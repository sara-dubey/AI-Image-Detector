// backend/src/imageToPdf.js
import { PDFDocument, StandardFonts } from "pdf-lib";
import sharp from "sharp";

// Single-image to PDF (kept if you still want it)
const PAGE_SIZES = {
  A4: { w: 595.28, h: 841.89 },
  LETTER: { w: 612, h: 792 },
};

export async function imageToPdfBuffer({
  imageBuffer,
  mime,
  pageSize = "A4",
  margin = 18,
  fit = "contain",
}) {
  const size = PAGE_SIZES[pageSize] || PAGE_SIZES.A4;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([size.w, size.h]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let embedded;
  if (mime === "image/png") embedded = await pdfDoc.embedPng(imageBuffer);
  else embedded = await pdfDoc.embedJpg(imageBuffer);

  const iw = embedded.width;
  const ih = embedded.height;

  const maxW = Math.max(1, size.w - 2 * margin);
  const maxH = Math.max(1, size.h - 2 * margin);

  const scale = fit === "cover" ? Math.max(maxW / iw, maxH / ih) : Math.min(maxW / iw, maxH / ih);

  const drawW = iw * scale;
  const drawH = ih * scale;

  const x = (size.w - drawW) / 2;
  const y = (size.h - drawH) / 2;

  page.drawImage(embedded, { x, y, width: drawW, height: drawH });
  page.drawText("", { x: 0, y: 0, size: 1, font });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// ✅ Multi-image -> multi-page PDF (used by ConvertPage.jsx)
export async function imagesToPdfBuffer(files) {
  const pdf = await PDFDocument.create();

  // A4 pages
  const W = PAGE_SIZES.A4.w;
  const H = PAGE_SIZES.A4.h;
  const M = 18;

  for (const f of files) {
    // normalize + respect EXIF orientation
    const pngBuf = await sharp(f.buffer, { failOnError: false })
      .rotate()
      .png()
      .toBuffer();

    const img = await pdf.embedPng(pngBuf);

    const page = pdf.addPage([W, H]);

    const maxW = W - 2 * M;
    const maxH = H - 2 * M;

    const iw = img.width;
    const ih = img.height;

    const scale = Math.min(maxW / iw, maxH / ih);
    const w = iw * scale;
    const h = ih * scale;

    const x = (W - w) / 2;
    const y = (H - h) / 2;

    page.drawImage(img, { x, y, width: w, height: h });
  }

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
