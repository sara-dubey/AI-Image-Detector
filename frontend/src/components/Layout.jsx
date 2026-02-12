import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";

export default function Layout() {
  return (
    <div
      className="page"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar />
      <div className="content" style={{ flex: 1 }}>
        <Outlet />
      </div>

      <div
        className="footer"
        style={{
          marginTop: "auto",
        }}
      >
         2026 • Virginia, USA
      </div>
    </div>
  );
}
