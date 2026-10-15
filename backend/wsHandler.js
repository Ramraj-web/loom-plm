import { WebSocketServer, WebSocket } from "ws";

const clients = new Set();

export function initWebSocket(server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    clients.add(ws);
    // Send welcome heartbeat
    try {
      ws.send(JSON.stringify({ type: "CONNECTED", clientCount: clients.size, time: new Date().toISOString() }));
    } catch (e) {}

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        // Broadcast received event to all OTHER clients
        broadcast(msg, ws);
      } catch (err) {
        console.warn("Invalid WS message received:", err.message);
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
    });

    ws.on("error", (err) => {
      console.warn("WebSocket client error:", err.message);
      clients.delete(ws);
    });
  });

  console.log("WebSocket Server initialized at /ws");
  return wss;
}

export function broadcast(payload, senderWs = null) {
  const data = typeof payload === "string" ? payload : JSON.stringify(payload);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN && client !== senderWs) {
      try {
        client.send(data);
      } catch (e) {
        clients.delete(client);
      }
    }
  }
}
