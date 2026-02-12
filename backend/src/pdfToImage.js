// backend/src/pdfToImage.js
import fs from "fs/promises";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import archiver from "archiver";
import { PassThrough } from "stream";

const execFileAsync = promisify(execFile);

function clamp(n, lo, hi, def) {
  const x = Number(n);
  if (!Number.isFinite(x)) return def;
  return Math.max(lo, Math.min(hi, x));
}

// Single-page render (kept)
export async function pdfToImageBuffer({ pdfBuffer, page = 1, format = "png", dpi = 150 }) {
  if (!Number.isFinite(page) || page < 1) throw new Error("page must be >= 1");
  const fmt = format === "jpeg" || format === "jpg" ? "jpeg" : "png";
  const ext = fmt === "jpeg" ? "jpg" : "png";
  const mime = fmt === "jpeg" ? "image/jpeg" : "image/png";

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pdf2img-"));
  const pdfPath = path.join(dir, "in.pdf");
  const outBase = path.join(dir, "out");

  try {
    await fs.writeFile(pdfPath, pdfBuffer);

    const args = [
      "-f", String(page),
      "-l", String(page),
      "-r", String(clamp(dpi, 72, 600, 150)),
      fmt === "jpeg" ? "-jpeg" : "-png",
      pdfPath,
      outBase,
    ];

    await execFileAsync("pdftoppm", args);

    const outFile = `${outBase}-${page}.${ext}`;
    const buffer = await fs.readFile(outFile);

    return { buffer, mime, ext };
  } finally {
    try { await fs.rm(dir, { recursive: true, force: true }); } catch {}
  }
}

// ✅ ALL pages -> ZIP (used by ConvertPage.jsx)
export async function pdfToImagesZipBuffer({ pdfBuffer, format = "png", dpi = 150 }) {
  const fmt = (format === "jpeg" || format === "jpg") ? "jpeg" : "png";
  const ext = fmt === "jpeg" ? "jpg" : "png";
  const r = clamp(dpi, 72, 600, 150);

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pdf2zip-"));
  const pdfPath = path.join(dir, "in.pdf");
  const outBase = path.join(dir, "page");

  try {
    await fs.writeFile(pdfPath, pdfBuffer);

    const args = [
      "-r", String(r),
      fmt === "jpeg" ? "-jpeg" : "-png",
      pdfPath,
      outBase,
    ];

    await execFileAsync("pdftoppm", args);

    const files = (await fs.readdir(dir))
      .filter((n) => n.startsWith("page-") && n.endsWith(`.${ext}`))
      .sort((a, b) => {
        const pa = Number(a.match(/page-(\d+)\./)?.[1] || 0);
        const pb = Number(b.match(/page-(\d+)\./)?.[1] || 0);
        return pa - pb;
      });

    const zipStream = archiver("zip", { zlib: { level: 9 } });
    const passthrough = new PassThrough();
    const chunks = [];

    const done = new Promise((resolve, reject) => {
      passthrough.on("data", (c) => chunks.push(c));
      passthrough.on("end", resolve);
      passthrough.on("error", reject);
      zipStream.on("error", reject);
    });

    zipStream.pipe(passthrough);

    for (const name of files) {
      const buf = await fs.readFile(path.join(dir, name));
      zipStream.append(buf, { name });
    }

    await zipStream.finalize();
    await done;

    return Buffer.concat(chunks);
  } finally {
    try { await fs.rm(dir, { recursive: true, force: true }); } catch {}
  }
}
