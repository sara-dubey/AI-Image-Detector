import { apiJson, apiGet } from "./client.js";

export async function startGenerate(payload) {
  // accept either negativePrompt or negative_prompt
  const negative_prompt = payload?.negative_prompt ?? payload?.negativePrompt ?? "";

  return apiJson("/api/generate", {
    prompt: payload?.prompt,
    negative_prompt,
    steps: payload?.steps,
    guidance: payload?.guidance,
    seed: payload?.seed,
  });
}

export async function getGenerateJob(jobId) {
  return apiGet(`/api/generate/${jobId}`);
}
