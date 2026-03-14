import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

// Unified domain routes
import authRoutes from "./routes/auth.routes.js";
import airlineRoutes from "./routes/airline.routes.js";
import apronRoutes from "./routes/apron.routes.js";
import atcRoutes from "./routes/atc.routes.js";
import aoccRoutes from "./routes/aocc.routes.js";

dotenv.config();

const app = express();

/**
 * 1️⃣ Security headers (OWASP)
 */
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

/**
 * 2️⃣ Body parsing with limit
 */
app.use(express.json({ limit: "256kb" }));

/**
 * 3️⃣ CORS
 */
const allowedOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/**
 * 4️⃣ Rate limiting
 */
const limiter = rateLimit({
  windowMs: 60000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

/**
 * 5️⃣ Health check
 */
app.get("/health", (req, res) => {
  res.json({ ok: true, message: "API is running" });
});

/**
 * 6️⃣ Unified API Routes
 */
app.use("/api/auth", authRoutes);
app.use("/api/flights", airlineRoutes); // AIRLINE role
app.use("/api/apron", apronRoutes);     // APRON role

/* ✅ FIXED HERE */
app.use("/api/atc", atcRoutes);         // ATC role (clean separation)

app.use("/api/aocc", aoccRoutes);       // AOCC role

/**
 * 7️⃣ 404 handler
 */
app.use((req, res) => {
  res.status(404).json({ ok: false, error: "Route not found" });
});

/**
 * 8️⃣ Central error handler
 */
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;

  res.status(status).json({
    ok: false,
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

export default app;