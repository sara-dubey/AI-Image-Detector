// backend/src/imageResize.js
import sharp from "sharp";

export function safeInt(v, def, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  const t = Math.trunc(n);
  if (min != null && t < min) return min;
  if (max != null && t > max) return max;
  return t;
}

export function safeFloat(v, def, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  if (min != null && n < min) return min;
  if (max != null && n > max) return max;
  return n;
}

// keepAspect comes as "1"/"0" from your frontend
export function coerceKeepAspect(v, def = true) {
  if (v === undefined || v === null || v === "") return def;
  const s = String(v).toLowerCase();
  if (s === "1" || s === "true" || s === "yes") return true;
  if (s === "0" || s === "false" || s === "no") return false;
  return def;
}

// If keepAspect is false -> we force fill
export function coerceFit(v, def = "contain", keepAspect = true) {
  if (!keepAspect) return "fill";
  const s = String(v || def).toLowerCase();
  if (s === "cover") return "cover";
  if (s === "fill") return "fill";
  return "contain";
}

// Your frontend sends outFormat: keep|png|jpeg|webp (jpg normalized to jpeg)
export function pickOutputFormatFromOutFormat({ outFormat, inputMime }) {
  const req = String(outFormat || "keep").toLowerCase();

  if (req === "png") return { fmt: "png", mime: "image/png", ext: "png" };
  if (req === "jpg" || req === "jpeg") return { fmt: "jpeg", mime: "image/jpeg", ext: "jpg" };
  if (req === "webp") return { fmt: "webp", mime: "image/webp", ext: "webp" };

  // keep -> infer from input mimetype
  if (inputMime === "image/png") return { fmt: "png", mime: "image/png", ext: "png" };
  if (inputMime === "image/webp") return { fmt: "webp", mime: "image/webp", ext: "webp" };
  return { fmt: "jpeg", mime: "image/jpeg", ext: "jpg" };
}

function applyEncoder(pipeline, format, quality) {
  const q = safeInt(quality, 85, 10, 95);
  if (format === "jpeg") return pipeline.jpeg({ quality: q, mozjpeg: true });
  if (format === "webp") return pipeline.webp({ quality: q });
  if (format === "png") return pipeline.png({ compressionLevel: 9 });
  return pipeline.jpeg({ quality: q, mozjpeg: true });
}

// -------- Resize by dimensions (no target size) --------
export async function resizeByDims({
  inputBuffer,
  width = null,
  height = null,
  fit = "contain",
  keepAspect = true,
  format = "jpeg",
  quality = 85,
}) {
  let img = sharp(inputBuffer, { failOnError: false });

  // keepAspect false => fill (stretch). keepAspect true => normal fit behavior.
  const chosenFit = keepAspect ? fit : "fill";

  if (width || height) {
    img = img.resize({
      width: width || null,
      height: height || null,
      fit: chosenFit === "cover" ? "cover" : chosenFit === "fill" ? "fill" : "contain",
      withoutEnlargement: true,
    });
  }

  img = applyEncoder(img, format, quality);

  const { data, info } = await img.toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    info: {
      width: info.width,
      height: info.height,
      format: info.format,
      bytes: data.length,
    },
  };
}

// -------- Compress to target MB (matches your frontend targetMB/min/max quality) --------
export async function compressToTargetMB({
  inputBuffer,
  targetMB = 1.0,
  minQuality = 35,
  maxQuality = 92,
  format = "jpeg",
}) {
  const targetBytes = Math.max(1, Math.floor(Number(targetMB) * 1024 * 1024));
  const qMin = safeInt(minQuality, 35, 5, 95);
  const qMax = safeInt(maxQuality, 92, 10, 95);

  // Start high, step down
  let q = qMax;
  let last = null;

  for (let i = 0; i < 14; i++) {
    let img = sharp(inputBuffer, { failOnError: false });

    img = applyEncoder(img, format, q);

    const { data, info } = await img.toBuffer({ resolveWithObject: true });
    last = { data, info, q };

    if (data.length <= targetBytes) break;

    const step = i < 4 ? 8 : 6;
    q = Math.max(qMin, q - step);
    if (q === qMin) break;
  }

  // If still too large, do a small downscale and retry once (helps huge images)
  if (last && last.data.length > targetBytes) {
    const meta = await sharp(inputBuffer, { failOnError: false }).metadata();
    const w = meta.width || null;
    const h = meta.height || null;

    // scale down 0.85x
    const newW = w ? Math.max(1, Math.floor(w * 0.85)) : null;
    const newH = h ? Math.max(1, Math.floor(h * 0.85)) : null;

    let img = sharp(inputBuffer, { failOnError: false }).resize({
      width: newW,
      height: newH,
      fit: "inside",
      withoutEnlargement: true,
    });

    img = applyEncoder(img, format, Math.max(qMin, last.q - 10));
    const { data, info } = await img.toBuffer({ resolveWithObject: true });
    last = { data, info, q: Math.max(qMin, last.q - 10) };
  }

  return {
    buffer: last.data,
    info: {
      width: last.info.width,
      height: last.info.height,
      format: last.info.format,
      bytes: last.data.length,
      qualityUsed: last.q,
      targetBytes,
    },
  };
}
