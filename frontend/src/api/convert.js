// frontend/src/api/convert.js
import { apiDownloadBlob } from "./client.js";

// ✅ ConvertPage.jsx expects: imagesToPdf(files: File[])
export async function imagesToPdf(files) {
  const fd = new FormData();
  for (const f of files) fd.append("images", f); // field name "images"
  return apiDownloadBlob("/api/convert/images-to-pdf", fd);
}

// ✅ ConvertPage.jsx expects: pdfToImages(pdf: File) -> ZIP blob
export async function pdfToImages(pdf) {
  const fd = new FormData();
  fd.append("pdf", pdf); // field name "pdf"
  // optional knobs if you add UI later:
  // fd.append("format", "png"); // png|jpeg
  // fd.append("dpi", "150");
  return apiDownloadBlob("/api/convert/pdf-to-images", fd);
}
