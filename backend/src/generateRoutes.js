import express from "express";

const router = express.Router();

// POST /api/generate
router.post("/generate", async (req, res) => {
  try {
    const jobs = req.app.locals.jobs;

    const prompt = String(req.body?.prompt ?? "").trim();
    const negative_prompt = String(req.body?.negative_prompt ?? "").trim();
    const steps = Number.isFinite(Number(req.body?.steps)) ? Number(req.body.steps) : 20;
    const guidance = Number.isFinite(Number(req.body?.guidance)) ? Number(req.body.guidance) : 7.5;
    const seed = Number.isFinite(Number(req.body?.seed)) ? Number(req.body.seed) : -1;

    if (!prompt) return res.status(400).json({ ok: false, error: "prompt is required" });

    const job = jobs.createJob({
      prompt,
      negative_prompt,
      steps,
      guidance,
      seed,
    });

    return res.json({
      ok: true,
      jobId: job.id,
      status: job.status,
      queuePosition: jobs.getQueuePosition(job.id),
      etaMs: jobs.estimateWaitMs(job.id),
      avgDurationMs: jobs.getAvgDurationMs(),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// GET /api/generate/:jobId
router.get("/generate/:jobId", (req, res) => {
  const jobs = req.app.locals.jobs;
  const id = req.params.jobId;

  const job = jobs.getJob(id);
  if (!job) return res.status(404).json({ ok: false, error: "Job not found" });

  return res.json({
    ok: true,
    id: job.id,
    status: job.status,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    durationMs: job.durationMs,
    elapsedMs: Date.now() - (job.startedAt || job.createdAt),

    queuePosition: jobs.getQueuePosition(id),
    etaMs: jobs.estimateWaitMs(id),
    avgDurationMs: jobs.getAvgDurationMs(),

    result: job.result,
    error: job.error,
  });
});

export default router;
