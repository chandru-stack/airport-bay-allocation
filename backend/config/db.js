import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  // Production-safe settings
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

// Success log
pool.on("connect", () => {
  console.log("✅ PostgreSQL connected");
});

// Error log
pool.on("error", (err) => {
  console.error("❌ PostgreSQL pool error:", err);
});

export default pool;