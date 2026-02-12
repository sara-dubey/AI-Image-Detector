import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load backend/.env (one level up from /src)
dotenv.config({ path: path.join(__dirname, "..", ".env") });

export const PORT = Number(process.env.PORT || 8080);

// If you want allow-any during dev, set CORS_ORIGIN=*
const rawCors = process.env.CORS_ORIGIN || "*";
export const CORS_ORIGIN = rawCors === "*" ? true : rawCors;

export const JSON_LIMIT = process.env.JSON_LIMIT || "10mb";
export const UPLOAD_LIMIT_BYTES = Number(process.env.UPLOAD_LIMIT_BYTES || 10 * 1024 * 1024);

export const SPACE_ID = process.env.SPACE_ID || "saradubey6/ai-image-detector";
