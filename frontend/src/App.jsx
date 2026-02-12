import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout.jsx";

import HomePage from "./pages/HomePage.jsx";
import GeneratePage from "./pages/GeneratePage.jsx";
import DetectPage from "./pages/DetectPage.jsx";
import ResizePage from "./pages/ResizePage.jsx";
import ConvertPage from "./pages/ConvertPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/generate" element={<GeneratePage />} />
        <Route path="/detect" element={<DetectPage />} />
        <Route path="/resize" element={<ResizePage />} />
        <Route path="/convert" element={<ConvertPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
