import { Router } from "express";
import pool from "../db/pool.js";

const router = Router();

// GET /api/reference/priorities
router.get("/priorities", async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT priority_level, priority_code, priority_name, description, is_emergency
      FROM priorities
      ORDER BY priority_level;
    `);
    res.json(rows);
  } catch (e) {
    console.error("reference/priorities error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
