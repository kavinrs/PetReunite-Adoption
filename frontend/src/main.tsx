// src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// Interface for browser-specific CSS properties
interface ExtendedCSSStyleDeclaration {
  webkitTextSizeAdjust?: string;
  msTextSizeAdjust?: string;
  textSizeAdjust?: string;
}

// Function to ensure consistent viewport behavior across all pages
const standardizeViewport = () => {
  // Prevent text size adjustment on mobile that can cause inconsistent scaling
  const bodyStyle = document.body.style as CSSStyleDeclaration &
    ExtendedCSSStyleDeclaration;
  bodyStyle.webkitTextSizeAdjust = "100%";
  bodyStyle.msTextSizeAdjust = "100%";
  bodyStyle.textSizeAdjust = "100%";

  // Ensure consistent viewport meta tag
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute(
      "content",
      "width=device-width, initial-scale=1.0, user-scalable=yes",
    );
  }
};

// Apply viewport standardization when DOM is loaded
document.addEventListener("DOMContentLoaded", standardizeViewport);

// Also apply on window load to catch any late changes
window.addEventListener("load", standardizeViewport);

// Apply on route changes (for SPA navigation)
window.addEventListener("popstate", standardizeViewport);

// Apply on page visibility change (when user returns to tab)
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    standardizeViewport();
  }
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
