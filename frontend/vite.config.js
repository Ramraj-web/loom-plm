import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
    proxy: {
      // Frontend la '/api' ku edhavadhu fetch pannalum, backend (port 5000) ku
      // automatic ah forward aagum. So App.jsx la fetch("/api/...") nu mattum kudutha podhum.
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
