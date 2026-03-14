import express from "express";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import pool from "../config/db.js";
import { signToken } from "../utils/jwt.js";

const router = express.Router();

/* -----------------------------
   Rate limit (brute-force protection)
------------------------------ */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, try again later" },
});

router.use(authLimiter);

/* -----------------------------
   Validation schemas
------------------------------ */
const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

/* -----------------------------
   LOGIN
------------------------------ */
router.post("/login", async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const { username, password } = parsed.data;

    const q = await pool.query(
      `SELECT u.*, r.role_name
       FROM users u
       JOIN roles r ON r.role_id = u.role_id
       WHERE u.username = $1
       LIMIT 1`,
      [username]
    );

    if (q.rowCount === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = q.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken({
      user_id: user.user_id,
      role_id: user.role_id,
      role_name: user.role_name,
      airline_code: user.airline_code,
    });

    res.json({
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        role_name: user.role_name,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Login failed" });
  }
});

export default router;