// backend/src/hfGenerate.js
import { client as gradioClient } from "@gradio/client";

export async function generateFromSpace({
  spaceId,
  hfToken,
  prompt,
  negativePrompt = "",
  steps = 20,
  guidance = 7.5,
  seed = -1,
  endpoint = "/generate",
}) {
  const app = await gradioClient(spaceId, { hf_token: hfToken || undefined });

  const payload = {
    prompt: String(prompt).trim(),
    negative_prompt: String(negativePrompt ?? "").trim(), // REQUIRED by your Space
    steps: Number.isFinite(Number(steps)) ? Number(steps) : 20,
    guidance: Number.isFinite(Number(guidance)) ? Number(guidance) : 7.5,
    seed: Number.isFinite(Number(seed)) ? Number(seed) : -1,
  };

  const res = await app.predict(endpoint, payload);

  const data = res?.data ?? res;
  const meta = Array.isArray(data) ? data[0] : null;
  const img = Array.isArray(data) ? data[1] : null;

  const imageUrl =
    typeof img === "string"
      ? img
      : img && typeof img === "object" && typeof img.url === "string"
        ? img.url
        : null;

  return { meta, imageUrl, rawImage: imageUrl ? null : img, endpointUsed: endpoint };
}
// if you already have generateFromSpace exported, ignore this.
// otherwise alias your existing function to generateFromSpace:
export const hfGenerate = generateFromSpace;
