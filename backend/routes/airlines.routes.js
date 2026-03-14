import { Router } from "express";
import pool from "../db/pool.js";


const router = Router();

// GET /api/airlines
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT airline_code, airline_name
      FROM airlines
      ORDER BY airline_code;
    `);
    res.json(rows);
  } catch (e) {
    console.error("airlines error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
