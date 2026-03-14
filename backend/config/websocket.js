import { WebSocketServer } from "ws";

let wss;

export function initWebSocket(server) {
  wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("🔌 WebSocket client connected");

    ws.on("close", () => {
      console.log("❌ WebSocket client disconnected");
    });
  });
}

export function broadcastEvent(event) {
  if (!wss) return;

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(event));
    }
  });
}