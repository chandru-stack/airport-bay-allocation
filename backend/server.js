import http from "http";
import dotenv from "dotenv";
import app from "./app.js";
import pool from "./config/db.js";
import { initWebSocket } from "./config/websocket.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket
initWebSocket(server);

// Start server after DB connection
async function startServer() {
  try {
    await pool.query("SELECT 1");
    console.log("✅ PostgreSQL connected");

    server.listen(PORT, () => {
      console.log(`🚀 Airport System running on port ${PORT}`);
    });

  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  }
}

startServer();