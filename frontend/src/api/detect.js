import { apiForm } from "./client.js";

export async function runDetect(file) {
  const fd = new FormData();
  fd.append("image", file);
  return apiForm("/api/detect", fd); // ✅ consistent
}
