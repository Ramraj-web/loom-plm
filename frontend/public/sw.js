// Loom PLM - Safe Service Worker
// CRITICAL SAFETY RULE:
// - NEVER cache /api/*
// - NEVER cache POST, PUT, PATCH, DELETE requests
// - NEVER cache dynamic orders, costing, T&A, auth, or user session data
// - Pass-through to network directly to guarantee 100% data freshness at all times

self.addEventListener("install", (event) => {
  // Activate worker immediately without waiting for old worker to exit
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Take control of all open clients immediately
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. HARD BYPASS: Never touch API requests or non-GET requests
  if (url.pathname.startsWith("/api") || event.request.method !== "GET") {
    return; // Browser performs default direct network fetch
  }

  // 2. Direct network pass-through for all requests
  // Ensures fresh live data while satisfying browser PWA installability requirements
  event.respondWith(
    fetch(event.request).catch((err) => {
      // If network fails (offline), propagate error or return fallback if needed
      console.warn("[SW] Network request failed:", event.request.url, err);
      throw err;
    })
  );
});
