import React, { useMemo, useState } from "react";
import { imagesToPdf, pdfToImages } from "../api/convert.js";

function bytesToMb(b) {
  if (!b && b !== 0) return "";
  return (b / (1024 * 1024)).toFixed(2);
}

export default function ConvertPage() {
  const [mode, setMode] = useState("img2pdf"); // img2pdf | pdf2img
  const [files, setFiles] = useState([]); // for img2pdf
  const [pdf, setPdf] = useState(null); // for pdf2img

  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [outUrl, setOutUrl] = useState("");

  const filesMeta = useMemo(() => {
    if (!files?.length) return null;
    const total = files.reduce((s, f) => s + (f?.size || 0), 0);
    return { count: files.length, totalMb: bytesToMb(total) };
  }, [files]);

  function onCancel() {
    setStatus("idle");
    setError("");
    setOutUrl("");
  }

  async function onRun() {
    setError("");
    setOutUrl("");

    try {
      setStatus("running");
      let blob;

      if (mode === "img2pdf") {
        if (!files.length) throw new Error("Upload images first.");
        blob = await imagesToPdf(files);
      } else {
        if (!pdf) throw new Error("Upload a PDF first.");
        blob = await pdfToImages(pdf);
      }

      const url = URL.createObjectURL(blob);
      setOutUrl(url);
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setError(e?.message ? String(e.message) : String(e));
    }
  }

  return (
    <div className="content">
      <div className="grid2">
        {/* LEFT */}
        <div className="panel">
          <div className="h2">⇄ Convert</div>
          <div className="sub">Images ↔ PDF (PDF→Images returns ZIP).</div>

          <div className="mt">
            <div className="labelRow">
              <div className="label">Mode</div>
              <div className="hint">Choose conversion direction</div>
            </div>

            <div className="chipRow">
              <button className={mode === "img2pdf" ? "modeChip active" : "modeChip"} type="button" onClick={() => setMode("img2pdf")}>
                Images → PDF
              </button>
              <button className={mode === "pdf2img" ? "modeChip active" : "modeChip"} type="button" onClick={() => setMode("pdf2img")}>
                PDF → Images
              </button>
            </div>
          </div>

          {/* Upload */}
          <div className="mt">
            <div className="labelRow">
              <div className="label">Upload</div>
              <div className="hint">{mode === "img2pdf" ? "select multiple images" : "single PDF"}</div>
            </div>

            {mode === "img2pdf" ? (
              <>
                <div className="filePickRow">
                  <input
                    id="convertImgs"
                    className="fileInput"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      setError("");
                      setOutUrl("");
                      setFiles(Array.from(e.target.files || []));
                    }}
                  />
                  <label className="fileBtn" htmlFor="convertImgs">Choose files</label>

                  <div className={`fileNamePill ${files.length ? "hasFile" : ""}`}>
                    {files.length ? (
                      <>
                        <span className="fileNameText">{filesMeta?.count} files selected</span>
                        <span className="fileSizeText">{filesMeta?.totalMb} MB</span>
                      </>
                    ) : (
                      <span className="filePlaceholder">No files chosen</span>
                    )}
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="miniMeta mtSmall">
                    {files.slice(0, 4).map((f) => f.name).join(", ")}
                    {files.length > 4 ? ` +${files.length - 4} more` : ""}
                  </div>
                )}
              </>
            ) : (
              <div className="filePickRow">
                <input
                  id="convertPdf"
                  className="fileInput"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    setError("");
                    setOutUrl("");
                    setPdf(e.target.files?.[0] || null);
                  }}
                />
                <label className="fileBtn" htmlFor="convertPdf">Choose file</label>

                <div className={`fileNamePill ${pdf ? "hasFile" : ""}`}>
                  {pdf ? (
                    <>
                      <span className="fileNameText">{pdf.name}</span>
                      <span className="fileSizeText">{bytesToMb(pdf.size)} MB</span>
                    </>
                  ) : (
                    <span className="filePlaceholder">No file chosen</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="mt">
            <div className="btnRow">
              <button className="btnPrimary" type="button" onClick={onRun} disabled={status === "running"}>
                {status === "running" ? "Converting..." : "Convert"}
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
          <div className="sub">
            {mode === "img2pdf" ? "Upload then press Convert." : "Upload a PDF then press Convert."}
          </div>

          <div className="previewBig">
            {status === "running" && (
              <div style={{ padding: 18 }}>
                <div className="progressTitle">Working…</div>
                <div className="progressSub">Preparing output…</div>
                <div className="barOuter"><div className="barInner" /></div>
              </div>
            )}

            {outUrl && (
              <div style={{ padding: 18 }}>
                <div style={{ color: "rgba(15,23,42,.78)", fontWeight: 800 }}>
                  Output ready:
                </div>
                <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                  <a
                    className="btnGhost"
                    href={outUrl}
                    download={mode === "img2pdf" ? "output.pdf" : "output.zip"}
                  >
                    Download
                  </a>
                </div>
              </div>
            )}

            {!outUrl && status !== "running" && (
              <div style={{ padding: 18, color: "rgba(15,23,42,.55)", fontWeight: 700 }}>
                Convert to generate output.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
