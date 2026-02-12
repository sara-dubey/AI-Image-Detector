import React, { useEffect, useMemo, useState } from "react";
import { resizeImage, compressToSize } from "../api/resize.js";

export default function ResizePage() {
  // upload
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // mode
  const [mode, setMode] = useState("dimensions"); // dimensions | target

  // fields (keep all)
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [fit, setFit] = useState("contain"); // contain | cover | fill
  const [quality, setQuality] = useState(85);
  const [format, setFormat] = useState("keep"); // keep | png | jpg | webp
  const [keepAspect, setKeepAspect] = useState(true);

  // target size fields
  const [targetMb, setTargetMb] = useState(1.0);
  const [minQuality, setMinQuality] = useState(35);
  const [maxQuality, setMaxQuality] = useState(92);

  // result / UI
  const [status, setStatus] = useState("idle"); // idle | running | done | error
  const [error, setError] = useState("");
  const [outBlob, setOutBlob] = useState(null);
  const [outUrl, setOutUrl] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (outUrl) URL.revokeObjectURL(outUrl);
    };
  }, [previewUrl, outUrl]);

  function pickFile(f) {
    if (!f) return;
    setError("");
    setStatus("idle");
    setOutBlob(null);
    if (outUrl) URL.revokeObjectURL(outUrl);
    setOutUrl("");

    setFile(f);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
  }

  function onCancel() {
    setStatus("idle");
    setError("");
    setOutBlob(null);
    if (outUrl) URL.revokeObjectURL(outUrl);
    setOutUrl("");
  }

  const fileMeta = useMemo(() => {
    if (!file) return "";
    const mb = (file.size / (1024 * 1024)).toFixed(2);
    return `${file.type || "file"} • ${mb} MB`;
  }, [file]);

  async function onRun() {
    if (!file) {
      setError("Upload an image first.");
      return;
    }

    setError("");
    setStatus("running");
    setOutBlob(null);
    if (outUrl) URL.revokeObjectURL(outUrl);
    setOutUrl("");

    try {
      let blob;

      if (mode === "dimensions") {
        blob = await resizeImage({
          file,
          width: Number(width),
          height: Number(height),
          fit,
          quality: Number(quality),
          format,
          keepAspect,
        });
      } else {
        // target size mode
        blob = await compressToSize({
          file,
          targetMb: Number(targetMb),
          minQuality: Number(minQuality),
          maxQuality: Number(maxQuality),
          format: format === "keep" ? "jpg" : format,
        });
      }

      setOutBlob(blob);
      setOutUrl(URL.createObjectURL(blob));
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setError(e?.message ? String(e.message) : String(e));
    }
  }

  const outName = useMemo(() => {
    if (!file) return "output";
    const base = file.name.replace(/\.[^.]+$/, "");
    const ext =
      mode === "target"
        ? (format === "keep" ? "jpg" : format)
        : (format === "keep" ? "png" : format);
    return `${base}_resized.${ext === "jpg" ? "jpg" : ext}`;
  }, [file, mode, format]);

  return (
    <div className="content">
      <div className="grid2">
        {/* LEFT */}
        <div className="panel">
          <div className="h2">✂️ Resize</div>
          <div className="sub">Resize by dimensions or hit a target file size.</div>

          {/* Upload */}
          <div className="mt">
            <div className="labelRow">
              <div className="label">Upload</div>
              <div className="hint">PNG / JPG / WEBP</div>
            </div>

            {/* Pretty file picker */}
            <label className="filePickBtn" style={{ display: "inline-flex" }}>
              Choose File
              <input
                type="file"
                accept="image/*"
                onChange={(e) => pickFile(e.target.files?.[0])}
                style={{ display: "none" }}
              />
            </label>

            <div className="hint" style={{ marginTop: 8 }}>
              {file ? `${file.name} • ${fileMeta}` : "No file chosen"}
            </div>
          </div>

          {/* Mode */}
          <div className="mt">
            <div className="labelRow">
              <div className="label">Mode</div>
              <div className="hint">Choose how to resize</div>
            </div>

            <div className="convertModeRow">
              <button
                type="button"
                className={mode === "dimensions" ? "modeChip active" : "modeChip"}
                onClick={() => setMode("dimensions")}
              >
                By Dimensions
              </button>
              <button
                type="button"
                className={mode === "target" ? "modeChip active" : "modeChip"}
                onClick={() => setMode("target")}
              >
                Target Size (MB)
              </button>
            </div>
          </div>

          {/* Fields */}
          {mode === "dimensions" ? (
            <>
              <div className="mt">
                <div className="row2">
                  <div className="field">
                    <div className="labelRow">
                      <div className="label">Width (px)</div>
                      <div className="hint">blank = unchanged</div>
                    </div>
                    <input className="inp" type="number" value={width} onChange={(e) => setWidth(e.target.value)} />
                  </div>
                  <div className="field">
                    <div className="labelRow">
                      <div className="label">Height (px)</div>
                      <div className="hint">blank = unchanged</div>
                    </div>
                    <input className="inp" type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
                  </div>
                </div>

                <div className="row2 mtSmall">
                  <div className="field">
                    <div className="labelRow">
                      <div className="label">Fit</div>
                      <div className="hint">contain / cover / fill</div>
                    </div>
                    <select className="inp" value={fit} onChange={(e) => setFit(e.target.value)}>
                      <option value="contain">contain</option>
                      <option value="cover">cover</option>
                      <option value="fill">fill</option>
                    </select>
                  </div>

                  <div className="field">
                    <div className="labelRow">
                      <div className="label">Quality</div>
                      <div className="hint">10–95</div>
                    </div>
                    <input className="inp" type="number" min={10} max={95} value={quality} onChange={(e) => setQuality(e.target.value)} />
                  </div>
                </div>

                <div className="row2 mtSmall">
                  <div className="field">
                    <div className="labelRow">
                      <div className="label">Format</div>
                      <div className="hint">keep / png / jpg / webp</div>
                    </div>
                    <select className="inp" value={format} onChange={(e) => setFormat(e.target.value)}>
                      <option value="keep">keep</option>
                      <option value="png">png</option>
                      <option value="jpg">jpg</option>
                      <option value="webp">webp</option>
                    </select>
                  </div>

                  <div className="field">
                    <div className="labelRow">
                      <div className="label">Keep aspect</div>
                      <div className="hint">preserve ratio</div>
                    </div>
                    <label className="followToggle">
                      <input
                        type="checkbox"
                        checked={keepAspect}
                        onChange={(e) => setKeepAspect(e.target.checked)}
                      />
                      <span>Enable</span>
                    </label>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mt">
                <div className="row2">
                  <div className="field">
                    <div className="labelRow">
                      <div className="label">Target (MB)</div>
                      <div className="hint">e.g. 1.0</div>
                    </div>
                    <input className="inp" type="number" step="0.1" value={targetMb} onChange={(e) => setTargetMb(e.target.value)} />
                  </div>

                  <div className="field">
                    <div className="labelRow">
                      <div className="label">Format</div>
                      <div className="hint">jpg/png/webp</div>
                    </div>
                    <select className="inp" value={format} onChange={(e) => setFormat(e.target.value)}>
                      <option value="jpg">jpg</option>
                      <option value="png">png</option>
                      <option value="webp">webp</option>
                      <option value="keep">keep</option>
                    </select>
                  </div>
                </div>

                <div className="row2 mtSmall">
                  <div className="field">
                    <div className="labelRow">
                      <div className="label">Min quality</div>
                      <div className="hint">lower bound</div>
                    </div>
                    <input className="inp" type="number" min={1} max={95} value={minQuality} onChange={(e) => setMinQuality(e.target.value)} />
                  </div>
                  <div className="field">
                    <div className="labelRow">
                      <div className="label">Max quality</div>
                      <div className="hint">upper bound</div>
                    </div>
                    <input className="inp" type="number" min={1} max={95} value={maxQuality} onChange={(e) => setMaxQuality(e.target.value)} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="mt">
            <div className="btnRow">
              <button className="btnPrimary" type="button" onClick={onRun} disabled={status === "running" || !file}>
                {status === "running" ? "Running..." : "Run"}
              </button>
              <button className="btnGhost" type="button" onClick={onCancel} disabled={status === "running"}>
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

        {/* RIGHT */}
        <div className="panel">
          <div className="h2">Result</div>
          <div className="sub">{file ? "Upload then press Run." : "Upload an image to start."}</div>

          <div className="previewBig">
            {status === "running" && (
              <div style={{ padding: 18 }}>
                <div className="progressTitle">Working…</div>
                <div className="progressSub">Resizing and optimizing.</div>
                <div className="barOuter"><div className="barInner" /></div>
              </div>
            )}

            {outUrl && status !== "running" && (
              <img src={outUrl} alt="output" />
            )}

            {!outUrl && status !== "running" && (
              <div style={{ padding: 18, color: "rgba(15,23,42,.55)", fontWeight: 700 }}>
                Upload an image to start.
              </div>
            )}
          </div>

          {outUrl && (
            <div className="progressCard">
              <div className="progressTitle">Download</div>
              <div className="progressSub">Your resized output is ready.</div>
              <a className="btnPrimary" href={outUrl} download={outName} style={{ display: "inline-flex", justifyContent: "center", marginTop: 10 }}>
                Download
              </a>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
