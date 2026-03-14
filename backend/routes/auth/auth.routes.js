import express from "express";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import pool from "../../db/pool.js";
import { signToken } from "../../utils/jwt.js";

const router = express.Router();

// OWASP: Rate limit auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later" },
});

router.use(authLimiter);

// Validation (OWASP: input validation)
const signupSchema = z.object({
  full_name: z.string().min(2).max(100),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9._-]+$/, "Invalid username"),
  password: z.string().min(8).max(72),
  role_id: z.number().int(),
  airline_code: z.string().min(2).max(10).optional().nullable(),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

function pickUser(u) {
  return {
    user_id: u.user_id,
    username: u.username,
    full_name: u.full_name,
    role_id: u.role_id,
    role_name: u.role_name,
    airline_code: u.airline_code,
    is_active: u.is_active,
    created_at: u.created_at,
  };
}

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

    // OWASP: generic error to prevent user enumeration
    if (q.rowCount === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = q.rows[0];

    if (user.is_active === false) {
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

    res.json({ token, user: pickUser(user) });
  } catch (err) {
    console.error("Login error:", err?.message);
    res.status(500).json({ message: "Login failed" });
  }
});

router.post("/signup", async (req, res) => {
  try {
    const parsed = signupSchema.safeParse({
      ...req.body,
      role_id: Number(req.body?.role_id),
    });
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const { full_name, username, password, role_id, airline_code } = parsed.data;

    // role must exist
    const roleCheck = await pool.query(
      "SELECT role_id, role_name FROM roles WHERE role_id = $1",
      [role_id]
    );
    if (roleCheck.rowCount === 0) {
      return res.status(400).json({ message: "Invalid request" });
    }
    const roleName = roleCheck.rows[0].role_name;

    // If AIRLINE role, airline_code must exist and be valid
    if (roleName === "AIRLINE") {
      if (!airline_code) {
        return res.status(400).json({ message: "Invalid request" });
      }
      const a = await pool.query("SELECT airline_code FROM airlines WHERE airline_code = $1", [
        airline_code,
      ]);
      if (a.rowCount === 0) {
        return res.status(400).json({ message: "Invalid request" });
      }
    }

    // Check unique username (safe to return conflict on signup; for login we keep generic)
    const exists = await pool.query("SELECT user_id FROM users WHERE username = $1", [username]);
    if (exists.rowCount > 0) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const insert = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, role_id, airline_code, is_active, created_at)
       VALUES ($1,$2,$3,$4,$5,true,NOW())
       RETURNING user_id`,
      [username, password_hash, full_name, role_id, roleName === "AIRLINE" ? airline_code : null]
    );

    const created = await pool.query(
      `SELECT u.*, r.role_name
       FROM users u
       JOIN roles r ON r.role_id = u.role_id
       WHERE u.user_id = $1`,
      [insert.rows[0].user_id]
    );

    const user = created.rows[0];

    const token = signToken({
      user_id: user.user_id,
      role_id: user.role_id,
      role_name: user.role_name,
      airline_code: user.airline_code,
    });

    res.json({ token, user: pickUser(user) });
  } catch (err) {
    console.error("Signup error:", err?.message);
    res.status(500).json({ message: "Signup failed" });
  }
});

export default router;
