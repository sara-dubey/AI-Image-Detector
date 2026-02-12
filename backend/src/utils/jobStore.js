// backend/src/utils/jobStore.js
import crypto from "crypto";

function now() {
  return Date.now();
}

export class JobStore {
  constructor({ ttlMs = 2 * 60 * 60 * 1000, rollingWindow = 20 } = {}) {
    this.ttlMs = ttlMs;

    this.jobs = new Map();        // id -> job
    this.queue = [];              // array of jobIds (queued, not running)
    this.currentJobId = null;     // running jobId

    this.lastDurationsMs = [];
    this.rollingWindow = rollingWindow;

    this.avgFallbackMs = 60_000;  // if no history, assume 60s
  }

  // ---- job lifecycle ----
  createJob(input) {
    const id = crypto.randomUUID();
    const t = now();

    const job = {
      id,
      status: "queued", // queued | running | done | error
      input,
      result: null,
      error: null,

      createdAt: t,
      updatedAt: t,
      startedAt: null,
      finishedAt: null,
      durationMs: null,
    };

    this.jobs.set(id, job);
    this.queue.push(id);
    this._gc();
    return job;
  }

  getJob(id) {
    this._gc();
    const job = this.jobs.get(id);
    if (!job) return null;
    // if expired, treat as not found
    if (now() - job.updatedAt > this.ttlMs) {
      this.jobs.delete(id);
      this._removeFromQueue(id);
      if (this.currentJobId === id) this.currentJobId = null;
      return null;
    }
    return job;
  }

  updateJob(id, patch) {
    const job = this.getJob(id);
    if (!job) return null;

    Object.assign(job, patch);
    job.updatedAt = now();
    return job;
  }

  markRunning(id) {
    const job = this.getJob(id);
    if (!job) return null;

    job.status = "running";
    job.startedAt = now();
    job.updatedAt = job.startedAt;
    this.currentJobId = id;
    return job;
  }

  markDone(id, result) {
    const job = this.getJob(id);
    if (!job) return null;

    job.status = "done";
    job.result = result;
    job.finishedAt = now();
    job.durationMs = job.finishedAt - (job.startedAt ?? job.createdAt);
    job.updatedAt = job.finishedAt;

    this._pushDuration(job.durationMs);
    if (this.currentJobId === id) this.currentJobId = null;
    return job;
  }

  markError(id, err) {
    const job = this.getJob(id);
    if (!job) return null;

    job.status = "error";
    job.error = err?.message ? String(err.message) : String(err);
    job.finishedAt = now();
    job.durationMs = job.finishedAt - (job.startedAt ?? job.createdAt);
    job.updatedAt = job.finishedAt;

    this._pushDuration(job.durationMs);
    if (this.currentJobId === id) this.currentJobId = null;
    return job;
  }

  // ---- queue ops (single-worker) ----
  popNextJob() {
    // only one at a time
    if (this.currentJobId) return null;

    while (this.queue.length) {
      const nextId = this.queue.shift();
      const job = this.getJob(nextId);
      if (!job) continue;
      if (job.status !== "queued") continue;
      return job;
    }
    return null;
  }

  getQueuePosition(id) {
    // running job => position -1
    if (this.currentJobId === id) return -1;
    return this.queue.indexOf(id); // 0 means next up
  }

  getAvgDurationMs() {
    if (this.lastDurationsMs.length === 0) return null;
    const sum = this.lastDurationsMs.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.lastDurationsMs.length);
  }

  estimateWaitMs(id) {
    const avg = this.getAvgDurationMs() ?? this.avgFallbackMs;

    // If job is running, estimate remaining
    if (this.currentJobId === id) {
      const job = this.getJob(id);
      if (!job?.startedAt) return avg;
      const elapsed = now() - job.startedAt;
      return Math.max(0, avg - elapsed);
    }

    // If queued, wait = remaining of running (if any) + jobs ahead * avg
    const pos = this.getQueuePosition(id);
    if (pos < 0) return 0; // not queued or running
    const runningRemaining = this.currentJobId ? avg : 0;
    return runningRemaining + pos * avg;
  }

  // ---- helpers ----
  _pushDuration(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return;
    this.lastDurationsMs.push(ms);
    if (this.lastDurationsMs.length > this.rollingWindow) {
      this.lastDurationsMs.shift();
    }
  }

  _removeFromQueue(id) {
    const idx = this.queue.indexOf(id);
    if (idx >= 0) this.queue.splice(idx, 1);
  }

  _gc() {
    const t = now();
    for (const [id, job] of this.jobs.entries()) {
      if (t - job.updatedAt > this.ttlMs) {
        this.jobs.delete(id);
        this._removeFromQueue(id);
        if (this.currentJobId === id) this.currentJobId = null;
      }
    }
  }
}
