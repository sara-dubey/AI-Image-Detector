import React, { useEffect, useMemo, useState } from "react";
import { startGenerate, getGenerateJob } from "../api/generate.js";

export default function GeneratePage() {
  // fields (keep all)
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [steps, setSteps] = useState(20);
  const [guidance, setGuidance] = useState(7.5);
  const [followPrompt, setFollowPrompt] = useState(true);
  const [seed, setSeed] = useState(-1);

  // job / UI
  const [status, setStatus] = useState("idle"); // idle | running | done | error
  const [error, setError] = useState("");
  const [job, setJob] = useState(null);
  const [imageUrl, setImageUrl] = useState("");

  // UX helpers
  const [runStartedAt, setRunStartedAt] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [stageText, setStageText] = useState(""); // "Generating..." / "Waking up..."

  const payload = useMemo(
    () => ({
      prompt,
      negative_prompt: negativePrompt,
      steps: Number(steps),
      guidance: Number(guidance),
      follow_prompt: Boolean(followPrompt),
      seed: Number(seed),
    }),
    [prompt, negativePrompt, steps, guidance, followPrompt, seed]
  );

  // Update elapsed timer while running
  useEffect(() => {
    if (status !== "running" || !runStartedAt) return;

    const id = setInterval(() => {
      const s = Math.floor((Date.now() - runStartedAt) / 1000);
      setElapsedSec(s);

      // Stage messaging:
      // 0-7s: "Generating…"
      // 8s+:  "Waking up HF Space…" (cold start hint)
      if (s >= 8) setStageText("Waking up Hugging Face Space… (cold start)");
      else setStageText("Generating…");
    }, 250);

    return () => clearInterval(id);
  }, [status, runStartedAt]);

  async function onGenerate() {
    if (!prompt.trim()) return;

    setError("");
    setStatus("running");
    setJob(null);
    setImageUrl("");

    const started = Date.now();
    setRunStartedAt(started);
    setElapsedSec(0);
    setStageText("Generating…");

    try {
      // Start
      const created = await startGenerate(payload);
      setJob(created);

      const jobId = created?.jobId || created?.id || created?.job_id;
      if (!jobId) throw new Error("Missing job id from server response.");

      // Poll
      for (let i = 0; i < 90; i++) {
        const j = await getGenerateJob(jobId);
        setJob(j);

        const state = String(j?.status || j?.state || "").toLowerCase();

        const img =
          j?.imageUrl ||
          j?.image_url ||
          j?.output?.imageUrl ||
          j?.output?.image_url ||
          j?.result?.imageUrl ||
          j?.result?.image_url;

        if (img) {
          setImageUrl(img);
          setStatus("done");
          setStageText("");
          return;
        }

        if (state === "failed" || state === "error") {
          throw new Error(j?.error || j?.message || "Generation failed.");
        }

        await new Promise((r) => setTimeout(r, 900));
      }

      setStatus("error");
      setError("Timed out waiting for result.");
      setStageText("");
    } catch (e) {
      setStatus("error");
      setError(e?.message ? String(e.message) : String(e));
      setStageText("");
    }
  }

  function onCancel() {
    setStatus("idle");
    setError("");
    setJob(null);
    setImageUrl("");
    setRunStartedAt(0);
    setElapsedSec(0);
    setStageText("");
  }

  // Enter key triggers generate (but allow multiline with Shift+Enter)
  function onPromptKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onGenerate();
    }
  }

  // Small inline spinner + indeterminate bar (no CSS edits needed)
  const Spinner = () => (
    <span
      aria-hidden
      style={{
        width: 16,
        height: 16,
        borderRadius: "50%",
        border: "3px solid rgba(0,0,0,0.15)",
        borderTopColor: "rgba(0,0,0,0.55)",
        display: "inline-block",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );

  const IndeterminateBar = () => (
    <div
      style={{
        position: "relative",
        height: 10,
        borderRadius: 999,
        background: "rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "-40%",
          width: "40%",
          height: "100%",
          borderRadius: 999,
          background: "rgba(0,0,0,0.35)",
          animation: "indet 1.2s ease-in-out infinite",
        }}
      />
    </div>
  );

  return (
    <div className="content">
      {/* keyframes (inline, no CSS file needed) */}
      <style>{`
        @keyframes indet { 0% { left: -40%; } 100% { left: 100%; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="grid2">
        {/* LEFT: form */}
        <div className="panel">
          <div className="h2">✨ Generate</div>
          <div className="sub">
            Create images using selected models (HF / API-backed).
          </div>

          {/* PROMPT — glow bar */}
          <div className="genField">
            <div className="genLabelRow">
              <div className="genLabel">Prompt</div>
              <div className="genHint">Describe what you want to generate.</div>
            </div>

            <div className="glowBar">
              <div></div>

              <textarea
                className="glowInput"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={onPromptKeyDown}
                placeholder="A fantasy landscape."
                rows={1}
              />
            </div>
          </div>

          {/* Negative prompt */}
          <div className="mt">
            <div className="labelRow">
              <div className="label">Negative prompt</div>
              <div className="hint">
                What you do NOT want (if your model supports it).
              </div>
            </div>
            <textarea
              className="ta"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="blurry, low quality, watermark, text..."
              rows={3}
            />
          </div>

          {/* Controls row */}
          <div className="mt">
            <div className="row2">
              <div className="field">
                <div className="labelRow">
                  <div className="label">Steps</div>
                  <div className="hint">Higher = slower</div>
                </div>
                <input
                  className="inp"
                  type="number"
                  min={1}
                  max={200}
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                />
              </div>

              <div className="field">
                <div className="labelRow">
                  <div className="label">Guidance</div>
                  <div className="hint">CFG scale</div>
                </div>
                <input
                  className="inp"
                  type="number"
                  step="0.1"
                  value={guidance}
                  onChange={(e) => setGuidance(e.target.value)}
                />
              </div>
            </div>

            <div className="row2 mtSmall">
              <div className="field">
                <div className="labelRow">
                  <div className="label">Seed</div>
                  <div className="hint">-1 random</div>
                </div>
                <input
                  className="inp"
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                />
              </div>

              <div className="field">
                <div className="labelRow">
                  <div className="label">Follow prompt</div>
                  <div className="hint">keep style aligned</div>
                </div>
                <label className="followToggle">
                  <input
                    type="checkbox"
                    checked={followPrompt}
                    onChange={(e) => setFollowPrompt(e.target.checked)}
                  />
                  <span>Enable</span>
                </label>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt">
            <div className="btnRow">
              <button
                className="btnPrimary"
                type="button"
                onClick={onGenerate}
                disabled={status === "running" || !prompt.trim()}
              >
                {status === "running" ? "Generating..." : "Generate"}
              </button>

              <button
                className="btnGhost"
                type="button"
                onClick={onCancel}
                disabled={status === "running"}
              >
                Cancel
              </button>
            </div>

            {error && (
              <div className="alert mtSmall">
                <b>Error:</b> {error}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: result */}
        <div className="panel">
          <div className="h2">Result</div>
          <div className="sub">
            {status === "idle" && "Press Generate to start."}
            {status === "running" && "Generating…"}
            {status === "done" && "Done."}
            {status === "error" && "Error."}
          </div>

          <div className="previewBig">
            {status === "running" && (
              <div style={{ padding: 18 }}>
                <div
                  className="progressTitle"
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  <Spinner />
                  <span>Working…</span>
                </div>

                <div className="progressSub" style={{ marginTop: 6 }}>
                  {stageText || "Generating…"}{" "}
                  <span style={{ opacity: 0.75 }}>
                    • Elapsed: {elapsedSec}s
                  </span>
                </div>

                <div style={{ marginTop: 12 }}>
                  <IndeterminateBar />
                </div>
              </div>
            )}

            {imageUrl && <img src={imageUrl} alt="generated" />}

            {!imageUrl && status !== "running" && (
              <div
                style={{
                  padding: 18,
                  color: "rgba(15,23,42,.55)",
                  fontWeight: 700,
                }}
              >
                Press Generate to start.
              </div>
            )}
          </div>

          {/* Collapsed debug JSON */}
          {job && (
            <details
              className="progressCard"
              style={{ marginTop: 12 }}
              open={status === "error"}
            >
              <summary className="progressTitle" style={{ cursor: "pointer" }}>
                Debug (raw JSON)
              </summary>
              <div className="progressSub" style={{ marginTop: 6 }}>
                Click to expand
              </div>
              <pre className="mono" style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>
                {JSON.stringify(job, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>

      
    </div>
  );
}
