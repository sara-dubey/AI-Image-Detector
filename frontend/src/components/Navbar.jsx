import React from "react";
import { NavLink, useLocation } from "react-router-dom";

export default function Navbar({ statusText = "Ready" }) {
  const loc = useLocation();
  const active = (path) => (loc.pathname === path ? "active" : "");

  // ✅ Edit these
  const DEV = {
    name: "Sarа Dubey",
    role: "AI / Full-Stack Developer",
    email: "mailto:saradubey98@gmail.com",
    github: "https://github.com/sara-dubey",
    linkedin: "https://www.linkedin.com/in/sara-dubey",
  };

  return (
    <div className="hero">
      <div className="heroOverlay" />

      <div className="heroTop">
        {/* Left brand pill */}
        <div className="brandPill brandPillCompact">
          <div className="brandName brandNameCompact">
            <span className="brandGrad">Rivel</span>{" "}
            <span className="brandPlain">Studio</span>
          </div>
        </div>

        {/* Center nav pill */}
        <nav className="navPill navPillCompact" aria-label="Primary">
          <NavLink to="/" end className={({ isActive }) => `navItem ${isActive ? "active" : ""}`}>
            Home
          </NavLink>

          <NavLink to="/detect" className={({ isActive }) => `navItem ${isActive ? "active" : ""}`}>
            Detect
          </NavLink>
          <NavLink to="/resize" className={({ isActive }) => `navItem ${isActive ? "active" : ""}`}>
            Resize
          </NavLink>
          <NavLink to="/convert" className={({ isActive }) => `navItem ${isActive ? "active" : ""}`}>
            Convert
          </NavLink>
          <NavLink to="/generate" className={({ isActive }) => `navItem ${isActive ? "active" : ""}`}>
            Generate
          </NavLink>
        </nav>

        {/* Right: developer info */}
        <div className="topRight">
          <div
            className="socialPill"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
            }}
            title="Developer info"
          >
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
              <div style={{ fontWeight: 800, fontSize: 12 }}>{DEV.name}</div>
              <div style={{ opacity: 0.75, fontSize: 11 }}>{DEV.role}</div>
            </div>

            <div style={{ width: 1, height: 22, background: "rgba(0,0,0,0.12)" }} />

            <a className="socialIcon" href={DEV.email} title="Email">
              @
            </a>
            <a className="socialIcon" href={DEV.github} target="_blank" rel="noreferrer" title="GitHub">
              GH
            </a>
            <a className="socialIcon" href={DEV.linkedin} target="_blank" rel="noreferrer" title="LinkedIn">
              in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
