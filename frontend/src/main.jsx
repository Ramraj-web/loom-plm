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

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Global React Error Boundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px 20px", maxWidth: 800, margin: "40px auto", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", background: "#FFFFFF", borderRadius: 12, border: "1px solid #FCA5A5", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 28 }}>⚠️</span>
            <div>
              <h2 style={{ margin: 0, color: "#991B1B", fontSize: 20 }}>Application Error Detected</h2>
              <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: 13 }}>An unexpected error occurred while rendering the interface.</p>
            </div>
          </div>
          <div style={{ background: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: 8, padding: 14, marginBottom: 18, color: "#B91C1C", fontSize: 13, fontFamily: "monospace", overflowX: "auto", whiteSpace: "pre-wrap" }}>
            {this.state.error?.toString()}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              style={{ background: "#4F46E5", color: "#FFFFFF", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Refresh Page
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("loom_user");
                sessionStorage.clear();
                window.location.reload();
              }}
              style={{ background: "#F1F5F9", color: "#475569", border: "1px solid #CBD5E1", borderRadius: 6, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Reset Session & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>
);
