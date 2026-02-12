import { generateFromSpace } from "../hfGenerate.js";

let started = false;

export function startQueueWorker({
  jobs,
  genSpaceId,
  hfToken,
  endpoint = "/generate",
  pollMs = 200,
} = {}) {
  if (started) return;
  started = true;

  async function loop() {
    try {
      const nextJob = jobs.popNextJob();
      if (nextJob) {
        jobs.markRunning(nextJob.id);

        try {
          const out = await generateFromSpace({
            spaceId: genSpaceId,
            hfToken,
            endpoint,
            prompt: nextJob.input.prompt,
            negativePrompt: nextJob.input.negative_prompt || "",
            steps: nextJob.input.steps,
            guidance: nextJob.input.guidance,
            seed: nextJob.input.seed,
          });

          jobs.markDone(nextJob.id, {
            endpointUsed: out.endpointUsed,
            meta: out.meta,
            imageUrl: out.imageUrl,
          });
        } catch (err) {
          jobs.markError(nextJob.id, err);
        }
      }
    } catch (e) {
      console.error("Queue worker error:", e);
    } finally {
      setTimeout(loop, pollMs);
    }
  }

  loop();
}
