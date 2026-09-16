// Defensive guard for browser extensions / DevTools PerformanceObserver errors
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    if (event.message && (event.message.includes("reading 'startTime'") || event.message.includes("reportAllChanges"))) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  }, true);
}

import React from "react";
import ReactDOM from "react-dom/client";
import "./storage.js";
import "./theme.css";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
