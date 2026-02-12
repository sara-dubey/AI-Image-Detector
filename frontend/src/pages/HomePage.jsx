import React from "react";
import { Link } from "react-router-dom";

function FeatureCard({ title, subtitle, bullets, to, emoji, note }) {
  return (
    <div className="panel">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <h3 className="h2" style={{ margin: 0 }}>
          <span style={{ marginRight: 8 }}>{emoji}</span>
          {title}
        </h3>
        <Link className="btnGhost" to={to} style={{ textDecoration: "none" }}>
          Open
        </Link>
      </div>

      <p className="sub" style={{ marginTop: 8 }}>
        {subtitle}
      </p>

      <ul
        style={{
          margin: 0,
          paddingLeft: 18,
          color: "rgba(15,23,42,.78)",
          fontWeight: 650,
        }}
      >
        {bullets.map((b, i) => (
          <li key={i} style={{ marginBottom: 6 }}>
            {b}
          </li>
        ))}
      </ul>

      {note && (
        <div
          style={{
            marginTop: 12,
            fontSize: 12,
            fontWeight: 800,
            color: "#a953z6",
            lineHeight: 1.35,
          }}
        >
          {note}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
              <div>
          A fully functional AI-integrated web application created to showcase
          the developer’s skills, experience, and design decisions. Built from
          scratch, no copied source code.
        </div>
      <div className="grid2 mt">
        <FeatureCard
          title="Detect"
          emoji="🧪"
          to="/detect"
          subtitle="Estimate whether an image looks AI-generated."
          bullets={[
            "Uses one or more detectors and aggregates a score",
            "Shows per-model confidence and final score",
            "Transparent: errors and model availability are surfaced",
          ]}
        />

        <FeatureCard
          title="Convert"
          emoji="🔁"
          to="/convert"
          subtitle="Convert images ↔ PDF (and more later)."
          bullets={[
            "Images → single PDF",
            "PDF → images (pages)",
            "Batch-friendly UX",
          ]}
        />

        <FeatureCard
          title="Resize"
          emoji="📐"
          to="/resize"
          subtitle="Resize by dimensions or hit a target file size."
          bullets={[
            "Resize to width/height or max dimension",
            "Compress to target size (MB) with quality control",
            "Preserve aspect ratio + preview before download",
          ]}
        />

        {/* Generate LAST + warning */}
        <FeatureCard
          title="Generate"
          emoji="✨"
          to="/generate"
          subtitle="Create images using selected models (HF / API-backed)."
          bullets={[
            "Prompt → image generation",
            "Optional presets (style, aspect ratio, seed)",
            "Designed to support queueing + retries",
          ]}
          note="Note: This uses a free Hugging Face model that may go to sleep. When it wakes up, generation can be slow and may take up to a few minutes."
        />
      </div>

      {/* End notes */}
      <div
        style={{
          marginTop: 18,
          fontSize: 12,
          opacity: 0.75,
          lineHeight: 1.55,
        }}
      >


        <div style={{ marginTop: 8 }}>
          Design choice: This app is intentionally built with practical,
          budget-aware decisions to serve real end users. While anyone can plug
          into expensive cloud AI APIs and produce flashy results, building a
          reliable experience within a defined cost (including free, sleep-prone
          services) is what truly puts engineering skill to the test.
        </div>
      </div>
    </>
  );
}
