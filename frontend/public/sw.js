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

// ==========================================
// 🔔 MOBILE PUSH NOTIFICATIONS HANDLER
// Displays native mobile drawer / lockscreen alerts
// ==========================================
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      title: "LOOM PLM Alert",
      message: event.data ? event.data.text() : "New notification received in LOOM PLM"
    };
  }

  const title = data.title || "LOOM PLM Alert";
  const body = data.message || data.body || "New update in LOOM PLM";
  const icon = data.icon || "/icons/icon-192.png";
  const badge = data.badge || "/favicon.svg";
  const tag = data.tag || (data.data?.orderId ? `order-${data.data.orderId}` : `loom-${Date.now()}`);

  const options = {
    body,
    icon,
    badge,
    vibrate: [200, 100, 200, 100, 200],
    tag,
    renotify: true,
    requireInteraction: false,
    data: {
      url: data.url || (data.data?.orderId ? `/?order=${data.data.orderId}` : "/"),
      orderId: data.data?.orderId || null,
      relatedModule: data.data?.relatedModule || null,
      timestamp: Date.now()
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ==========================================
// 👆 NOTIFICATION CLICK HANDLER
// Directs user to the specific Order / Module on click
// ==========================================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const notifData = event.notification.data || {};
  const targetUrl = notifData.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // 1. If an existing window/tab is open, focus it and tell it which order to open
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          try {
            client.postMessage({
              type: "LOOM_NOTIFICATION_CLICKED",
              data: notifData
            });
          } catch (err) {}
          return;
        }
      }
      // 2. If no window is open, open a new window to the target URL
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
