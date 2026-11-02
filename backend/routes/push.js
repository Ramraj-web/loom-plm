import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import webpush from "web-push";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const VAPID_FILE = path.join(DATA_DIR, "vapid.json");
const SUBS_FILE = path.join(DATA_DIR, "push_subscriptions.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 1. Initialize or Load VAPID Keys
let vapidKeys;
try {
  if (fs.existsSync(VAPID_FILE)) {
    vapidKeys = JSON.parse(fs.readFileSync(VAPID_FILE, "utf8"));
  } else {
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2), "utf8");
    console.log("[Push] Generated fresh VAPID keys saved to vapid.json");
  }
} catch (e) {
  console.warn("[Push] Error loading VAPID file, generating fallback keys:", e.message);
  vapidKeys = webpush.generateVAPIDKeys();
}

webpush.setVapidDetails(
  "mailto:support@loomplm.internal",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// 2. File-based Push Subscriptions Storage
function readSubscriptions() {
  try {
    if (fs.existsSync(SUBS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SUBS_FILE, "utf8"));
      return Array.isArray(data) ? data : [];
    }
  } catch (e) {
    console.warn("[Push] Read subscriptions warning:", e.message);
  }
  return [];
}

function writeSubscriptions(subs) {
  try {
    fs.writeFileSync(SUBS_FILE, JSON.stringify(subs, null, 2), "utf8");
  } catch (e) {
    console.warn("[Push] Write subscriptions error:", e.message);
  }
}

// 3. API Endpoints

// GET /api/push/public-key - Client fetches VAPID public key to subscribe
router.get("/public-key", (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// POST /api/push/subscribe - Register or update a user's mobile device subscription
router.post("/subscribe", (req, res) => {
  const { userId, username, role, subscription, userAgent } = req.body || {};
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: "Invalid push subscription object" });
  }

  const subs = readSubscriptions();
  const existingIdx = subs.findIndex(s => s.subscription?.endpoint === subscription.endpoint);

  const newRecord = {
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId: userId || "guest",
    username: username || "User",
    role: role || "",
    subscription,
    userAgent: userAgent || "",
    active: true,
    updatedAt: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    subs[existingIdx] = {
      ...subs[existingIdx],
      ...newRecord,
      id: subs[existingIdx].id
    };
  } else {
    subs.push(newRecord);
  }

  writeSubscriptions(subs);
  console.log(`[Push] Registered subscription for user ${username || userId} (Total active: ${subs.filter(s => s.active).length})`);
  res.json({ success: true, count: subs.filter(s => s.active).length });
});

// POST /api/push/unsubscribe - Unregister device on logout so NO messages go after logout
router.post("/unsubscribe", (req, res) => {
  const { userId, endpoint } = req.body || {};
  let subs = readSubscriptions();

  let removed = 0;
  if (endpoint) {
    subs = subs.filter(s => {
      if (s.subscription?.endpoint === endpoint) {
        removed++;
        return false;
      }
      return true;
    });
  } else if (userId) {
    subs = subs.filter(s => {
      if (s.userId === userId) {
        removed++;
        return false;
      }
      return true;
    });
  }

  writeSubscriptions(subs);
  console.log(`[Push] Unsubscribed ${removed} device(s) for user: ${userId || "unknown"}`);
  res.json({ success: true, removedCount: removed });
});

// Helper function to send push notification
export async function sendPushNotification({
  targetUserId,
  targetUsername,
  targetRole,
  title = "LOOM PLM Alert",
  message = "New notification received",
  url = "/",
  data = {},
  priority = "medium"
}) {
  const subs = readSubscriptions();
  const activeSubs = subs.filter(s => s.active && s.subscription?.endpoint);
  if (activeSubs.length === 0) return { delivered: 0 };

  // Filter subscriptions matching target user/role if specified
  const targets = activeSubs.filter(s => {
    if (!targetUserId && !targetUsername && !targetRole) return true; // broadcast
    if (targetUserId && (s.userId === targetUserId || targetUserId === "all")) return true;
    if (targetUsername && s.username?.toLowerCase() === targetUsername.toLowerCase()) return true;
    if (targetRole && s.role?.toLowerCase() === targetRole.toLowerCase()) return true;
    return false;
  });

  if (targets.length === 0) return { delivered: 0 };

  const payload = JSON.stringify({
    title,
    message,
    body: message,
    url,
    priority,
    icon: "/icons/icon-192.png",
    badge: "/favicon.svg",
    timestamp: Date.now(),
    data: {
      url,
      ...data
    }
  });

  const staleEndpoints = new Set();
  let delivered = 0;

  await Promise.all(
    targets.map(async (target) => {
      try {
        await webpush.sendNotification(target.subscription, payload, {
          TTL: 60 * 60 * 24 // 24 hours
        });
        delivered++;
      } catch (err) {
        // If 404 or 410 Gone, device unregistered or expired
        if (err.statusCode === 404 || err.statusCode === 410) {
          staleEndpoints.add(target.subscription.endpoint);
        } else {
          console.warn(`[Push] Delivery error for user ${target.username}:`, err.message);
        }
      }
    })
  );

  // Clean up stale endpoints
  if (staleEndpoints.size > 0) {
    const cleaned = subs.filter(s => !staleEndpoints.has(s.subscription?.endpoint));
    writeSubscriptions(cleaned);
  }

  return { delivered, targetCount: targets.length };
}

// POST /api/push/send - Dispatch push notification
router.post("/send", async (req, res) => {
  try {
    const result = await sendPushNotification(req.body || {});
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
