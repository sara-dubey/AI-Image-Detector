// backend/src/imageConvert.js
import sharp from "sharp";
import { safeInt } from "./imageResize.js";

export async function convertImage({ inputBuffer, to = "png", quality = 90 }) {
  let img = sharp(inputBuffer, { failOnError: false });
  const fmt = String(to).toLowerCase();
  const q = safeInt(quality, 90, 10, 95);

  if (fmt === "jpg" || fmt === "jpeg") img = img.jpeg({ quality: q, mozjpeg: true });
  else if (fmt === "png") img = img.png({ compressionLevel: 9 });
  else if (fmt === "webp") img = img.webp({ quality: q });
  else throw new Error(`Unsupported output format: ${to}`);

  const { data, info } = await img.toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    info: { width: info.width, height: info.height, format: info.format, bytes: data.length },
  };
}
