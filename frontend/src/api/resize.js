// frontend/src/api/resize.js
import { apiDownloadBlob } from "./client.js";

function normalizeFormat(format) {
  if (!format || format === "keep") return "keep";
  if (format === "jpg") return "jpeg";
  return format;
}

export async function resizeImage({
  file,
  width,
  height,
  fit = "contain",
  quality = 85,
  format = "keep",
  keepAspect = true,
}) {
  const fd = new FormData();
  fd.append("image", file);

  // Only send width/height if user actually entered something
  if (width !== "" && width != null) fd.append("width", String(width));
  if (height !== "" && height != null) fd.append("height", String(height));

  fd.append("fit", String(fit));
  fd.append("quality", String(quality));

  // backend might expect either "format" or "outFormat" – send both safely
  const fmt = normalizeFormat(format);
  fd.append("format", fmt);
  fd.append("outFormat", fmt);

  // backend might expect either true/false or 1/0 – send both safely
  fd.append("keepAspect", keepAspect ? "true" : "false");
  fd.append("keepAspectBool", keepAspect ? "1" : "0");

  // ✅ returns Blob (image)
  return apiDownloadBlob("/api/resize", fd);
}

export async function compressToSize({
  file,
  targetMb = 1.0,
  minQuality = 35,
  maxQuality = 92,
  format = "jpg",
}) {
  const fd = new FormData();
  fd.append("image", file);

  // send both common key variants (backend differences)
  fd.append("targetMB", String(targetMb));
  fd.append("targetMb", String(targetMb));

  fd.append("minQuality", String(minQuality));
  fd.append("maxQuality", String(maxQuality));

  const fmt = normalizeFormat(format);
  fd.append("format", fmt);
  fd.append("outFormat", fmt);

  // ✅ returns Blob (image)
  return apiDownloadBlob("/api/resize/compress", fd);
}
