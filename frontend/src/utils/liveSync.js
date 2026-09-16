// Real-Time Multi-User Synchronization via WebSockets & BroadcastChannel
// Ensures that when User 1 updates a stage, User 2 and User 3 on other systems or tabs
// instantly see the updated stage without manual refresh.

let socket = null;
let reconnectTimer = null;
let broadcastChannel = null;
const listeners = new Set();

try {
  if (typeof window !== "undefined" && window.BroadcastChannel) {
    broadcastChannel = new BroadcastChannel("loom_live_sync_channel");
    broadcastChannel.onmessage = (event) => {
      if (event.data) {
        notifyListeners(event.data);
      }
    };
  }
} catch (e) {
  console.warn("BroadcastChannel not available:", e);
}

function notifyListeners(data) {
  listeners.forEach(cb => {
    try {
      cb(data);
    } catch (err) {
      console.warn("Error in liveSync listener:", err);
    }
  });
}

function getWebSocketUrl() {
  if (typeof window === "undefined") return "ws://localhost:5000/ws";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const hostname = window.location.hostname || "localhost";
  // If running via Vite dev server on 5173 or preview, backend is on 5000:
  const port = (window.location.port === "5173" || window.location.port === "4173") ? "5000" : (window.location.port || "5000");
  return `${protocol}//${hostname}:${port}/ws`;
}

export function connectWebSocket() {
  if (typeof window === "undefined") return;
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  const url = getWebSocketUrl();
  try {
    socket = new WebSocket(url);

    socket.onopen = () => {
      console.log("⚡ Live WebSocket connected for multi-user sync:", url);
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        notifyListeners(data);
      } catch (err) {
        console.warn("Failed to parse WS payload:", err);
      }
    };

    socket.onclose = () => {
      socket = null;
      // Reconnect after 3 seconds
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          connectWebSocket();
        }, 3000);
      }
    };

    socket.onerror = (err) => {
      try {
        socket.close();
      } catch (e) {}
    };
  } catch (err) {
    console.warn("Could not initiate WebSocket:", err.message);
  }
}

export function subscribeLiveSync(callback) {
  listeners.add(callback);
  connectWebSocket();
  return () => {
    listeners.delete(callback);
  };
}

export function broadcastLiveUpdate(payload) {
  const message = {
    ...payload,
    timestamp: new Date().toISOString()
  };

  // 1. Send via local BroadcastChannel (instant inter-tab on same machine)
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(message);
    } catch (e) {}
  }

  // 2. Send via WebSocket (across different machines / logins)
  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
      socket.send(JSON.stringify(message));
    } catch (e) {
      console.warn("Failed to send WebSocket message:", e);
    }
  }
}
