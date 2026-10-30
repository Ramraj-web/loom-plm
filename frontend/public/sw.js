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
