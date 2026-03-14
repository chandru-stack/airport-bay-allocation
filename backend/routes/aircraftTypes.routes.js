import { Router } from "express";
import pool from "../db/pool.js";


const router = Router();

// GET /api/aircraft-types
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT aircraft_type_code, aircraft_name, icao_category
      FROM aircraft_types
      ORDER BY aircraft_type_code;
    `);
    res.json(rows);
  } catch (e) {
    console.error("aircraft-types error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
