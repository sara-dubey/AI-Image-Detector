import express from "express";
import cors from "cors";
import { PORT, CORS_ORIGIN, JSON_LIMIT } from "./config.js";

import detectRoute from "./detectRoute.js";
import resizeRoutes from "./resizeRoutes.js";
import convertRoutes from "./convertRoutes.js";
import generateRoutes from "./generateRoutes.js";

import { rateLimit } from "./middleware/rateLimit.js";

import { JobStore } from "./utils/jobStore.js";
import { startQueueWorker } from "./utils/queueWorker.js";
import { SimpleTTLCache } from "./utils/cache.js";

const app = express();

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: JSON_LIMIT }));

// ✅ shared singletons (available to all routes)
app.locals.jobs = new JobStore({ ttlMs: 2 * 60 * 60 * 1000, rollingWindow: 20 });
app.locals.detectCache = new SimpleTTLCache({ ttlMs: 5 * 60_000, maxItems: 200 });

// ✅ global API rate limit
app.use(
  "/api",
  rateLimit({
    windowMs: 60_000,
    max: 60,
  })
);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ✅ start 1 background worker for generate queue
startQueueWorker({
  jobs: app.locals.jobs,
  genSpaceId: process.env.GENERATE_SPACE_ID || "saradubey6/prompt-to-image",
  hfToken: process.env.HF_TOKEN || "",
  endpoint: process.env.GENERATE_ENDPOINT || "/generate",
  pollMs: 200,
});

// ✅ mount all routes
app.use("/api", detectRoute);
app.use("/api", resizeRoutes);
app.use("/api", convertRoutes);
app.use("/api", generateRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
