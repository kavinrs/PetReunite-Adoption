
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";


interface ExtendedCSSStyleDeclaration {
  webkitTextSizeAdjust?: string;
  msTextSizeAdjust?: string;
  textSizeAdjust?: string;
}


const standardizeViewport = () => {
  
  const bodyStyle = document.body.style as CSSStyleDeclaration &
    ExtendedCSSStyleDeclaration;
  bodyStyle.webkitTextSizeAdjust = "100%";
  bodyStyle.msTextSizeAdjust = "100%";
  bodyStyle.textSizeAdjust = "100%";

  
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute(
      "content",
      "width=device-width, initial-scale=1.0, user-scalable=yes",
    );
  }
};


document.addEventListener("DOMContentLoaded", standardizeViewport);


window.addEventListener("load", standardizeViewport);


window.addEventListener("popstate", standardizeViewport);


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
