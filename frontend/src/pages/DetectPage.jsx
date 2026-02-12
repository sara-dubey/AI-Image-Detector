import React, { useEffect, useMemo, useState } from "react";
import { runDetect } from "../api/detect.js";

function modelNameOnly(modelId) {
  if (!modelId) return "";
  return modelId.includes("/") ? modelId.split("/")[1] : modelId;
}

function toPercent(p) {
  const n = Number(p);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 10000) / 100; // 2 decimals
}

function tagFromProb(p) {
  const n = Number(p);
  if (!Number.isFinite(n)) return "UNKNOWN";
  return n >= 0.5 ? "AI" : "REAL";
}

export default function DetectPage() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [status, setStatus] = useState("idle"); // idle | running | done | error
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function pickFile(f) {
    if (!f) return;
    setError("");
    setResult(null);
    setStatus("idle");
    setFile(f);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
  }

  function remove() {
    setFile(null);
    setError("");
    setResult(null);
    setStatus("idle");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
  }

  async function onRun() {
    if (!file) {
      setError("Please upload an image first.");
      return;
    }
    setError("");
    setResult(null);
    setStatus("running");

    try {
      const out = await runDetect(file);
      setResult(out);
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setError(e?.message ? String(e.message) : String(e));
    }
  }

  // Normalize your backend response shape:
  const normalized = useMemo(() => {
    const r = result?.result || null; // { ai_probability, label, per_model, used_models }
    const per = Array.isArray(r?.per_model) ? r.per_model : [];
    const finalProb = r?.ai_probability;
    const finalPercent = toPercent(finalProb);
    const finalTag = r?.label || tagFromProb(finalProb);
    return {
      has: !!r,
      finalProb,
      finalPercent,
      finalTag,
      usedModels: r?.used_models,
      perModel: per,
    };
  }, [result]);

  return (
    <div className="detectWrap">
      <div className="detectCard">
        <div className="dfHero">
          <div className="dfHeroInner">
            <div className="dfHeroIcon" aria-hidden>
              +
            </div>
            <div className="dfHeroText">
              <div className="dfHeroTitle">Upload an image</div>
              <div className="dfHeroSub">
                Drag & drop or browse to detect AI vs Real.
              </div>
            </div>
          </div>
        </div>

        <div className="detectBody">
          <div
            className={`dropZone ${isDragOver ? "dropZoneActive" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) pickFile(f);
            }}
          >
            <input
              className="dropInput"
              type="file"
              accept="image/*"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
            <div className="dropTitle">DRAG &amp; DROP</div>
            <div className="dropSub">
              your files or <span className="linkBtn">Browse</span>
            </div>
            <div className="dropMeta">PNG / JPG • up to 5MB</div>
          </div>

          <div className="detectHint">
            Upload an image to see a confidence score and model breakdown.
          </div>

          {file && (
            <div className="previewShell">
              <img className="previewImg" src={previewUrl} alt="preview" />

              <div className="previewBar">
                <div className="previewName">{file.name}</div>
                <div className="previewBtns">
                  <button className="pillBtn" onClick={remove} type="button">
                    Remove
                  </button>
                  <button
                    className="pillBtnPrimary"
                    onClick={onRun}
                    disabled={status === "running"}
                    type="button"
                  >
                    {status === "running" ? "Running..." : "Run Detect"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="detectAlert">
                  <div className="detectAlertTitle">Error</div>
                  <div className="detectAlertBody">{error}</div>
                </div>
              )}

              {status === "running" && (
                <div className="detectProgress">
                  <div className="detectProgressTitle">Detecting…</div>
                  <div className="detectProgressBar">
                    <div className="detectProgressFill" />
                  </div>
                </div>
              )}

              {/* ✅ Final UI (percentage + tag) + per-model breakdown */}
              {normalized.has && (
                <div className="detectOutput">
                  <div className="detectOutputTitle">Result</div>

                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "baseline",
                      flexWrap: "wrap",
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ fontSize: 22, fontWeight: 800 }}>
                      {normalized.finalPercent}% 
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>
                      Tag: {normalized.finalTag}
                    </div>
                    {Number.isFinite(Number(normalized.usedModels)) && (
                      <div style={{ opacity: 0.7 }}>
                        Models used: {normalized.usedModels}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {normalized.perModel.map((m, idx) => {
                      const prob = m?.ai_probability;
                      const ok = !!m?.ok;
                      return (
                        <div
                          key={idx}
                          style={{
                            border: "1px solid rgba(0,0,0,0.12)",
                            borderRadius: 12,
                            padding: 12,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <div style={{ fontWeight: 800 }}>
                              {modelNameOnly(m?.model)}
                            </div>
                            {ok ? (
                              <div style={{ fontWeight: 800 }}>
                                {toPercent(prob)}% • {tagFromProb(prob)}
                              </div>
                            ) : (
                              <div style={{ color: "crimson", fontWeight: 700 }}>
                                Failed
                              </div>
                            )}
                          </div>

                          {ok ? (
                            <div style={{ marginTop: 6, opacity: 0.85, fontSize: 13 }}>
                              Weight: {m?.weight}
                            </div>
                          ) : (
                            <div style={{ marginTop: 6, color: "crimson", fontSize: 13 }}>
                              {m?.error}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* optional: keep raw JSON collapsed for debugging */}
                  <details style={{ marginTop: 12 }}>
                    <summary style={{ cursor: "pointer" }}>Raw JSON</summary>
                    <pre className="detectPre">{JSON.stringify(result, null, 2)}</pre>
                  </details>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
