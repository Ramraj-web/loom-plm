/**
 * Loom PLM - Mobile Push Notifications & Drawer Alert Utility
 * Manages device registration, native lockscreen alerts, and logout cleanup.
 */

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushNotificationSupported() {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

/**
 * Register mobile device for push alerts when user logs in
 */
export async function registerPushDevice(activeUser) {
  if (!isPushNotificationSupported() || !activeUser) return false;

  try {
    let perm = Notification.permission;
    if (perm === "default") {
      perm = await Notification.requestPermission();
    }
    if (perm !== "granted") {
      console.log("[Push] Notification permission not granted:", perm);
      return false;
    }

    const reg = await navigator.serviceWorker.ready;
    if (!reg.pushManager) return false;

    // 1. Fetch backend VAPID public key
    const res = await fetch("/api/push/public-key");
    if (!res.ok) return false;
    const { publicKey } = await res.json();
    if (!publicKey) return false;

    // 2. Check existing subscription or subscribe new
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
    }

    // 3. Register subscription on backend with this user's identity
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: activeUser.id || activeUser.userId || "user",
        username: activeUser.name || activeUser.username || "User",
        role: activeUser.role?.label || activeUser.role || "",
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent
      })
    });

    try {
      localStorage.setItem("loom_push_subscribed", "true");
    } catch (e) {}

    console.log("[Push] Device successfully registered for user:", activeUser.name || activeUser.username);
    return true;
  } catch (err) {
    console.warn("[Push] Error registering push device:", err.message);
    return false;
  }
}

/**
 * Unsubscribe mobile device on logout so NO messages go after logout!
 */
export async function unregisterPushDevice(activeUser) {
  if (!isPushNotificationSupported()) return false;

  try {
    const reg = await navigator.serviceWorker.ready;
    if (reg.pushManager) {
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe().catch(() => {});

        // Inform backend to remove subscription immediately
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: activeUser?.id,
            endpoint
          })
        }).catch(() => {});
      }
    }

    try {
      localStorage.removeItem("loom_push_subscribed");
    } catch (e) {}

    console.log("[Push] Device successfully unregistered on logout.");
    return true;
  } catch (err) {
    console.warn("[Push] Error unregistering push device:", err.message);
    return false;
  }
}

/**
 * Trigger native mobile drawer alert (works even if site tab is in background)
 */
export function triggerMobileDrawerAlert({ title, message, orderId, url, tag, priority }) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title || "LOOM PLM Alert", {
          body: message || "New update in LOOM PLM",
          icon: "/icons/icon-192.png",
          badge: "/favicon.svg",
          vibrate: priority === "high" || priority === "urgent" ? [300, 100, 300, 100, 300] : [200, 100, 200],
          tag: tag || (orderId ? `order-${orderId}` : `loom-${Date.now()}`),
          renotify: true,
          data: {
            url: url || (orderId ? `/?order=${orderId}` : "/"),
            orderId: orderId || null
          }
        });
      }).catch(() => {});
    }
  } catch (e) {}
}

