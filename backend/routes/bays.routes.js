import { Router } from "express";
import pool from "../db/pool.js";


const router = Router();

// GET /api/bays/types  -> ["AEROBRIDGE","REMOTE",...]
router.get("/types", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT bay_type
      FROM bays
      WHERE bay_type IS NOT NULL
      ORDER BY bay_type;
    `);
    res.json(rows.map(r => r.bay_type));
  } catch (e) {
    console.error("bays/types error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/bays/available?aircraftType=A320&bayType=AEROBRIDGE&start=ISO&end=ISO
router.get("/available", async (req, res) => {
  try {
    const aircraftType = String(req.query.aircraftType || "").toUpperCase();
    const bayType = req.query.bayType ? String(req.query.bayType).toUpperCase() : null;
    const start = req.query.start;
    const end = req.query.end;

    if (!aircraftType || !start || !end) {
      return res.status(400).json({
        ok: false,
        error: "aircraftType, start, end are required",
      });
    }

    // Uses your DB views v_bay_category_rank + v_aircraft_category_rank
    const { rows } = await pool.query(
      `
      SELECT b.bay_id, b.bay_name, b.bay_type
      FROM v_bay_category_rank b
      JOIN v_aircraft_category_rank a
        ON a.aircraft_type_code = $1
      WHERE b.status = 'AVAILABLE'
        AND b.bay_rank >= a.ac_rank                       -- ✅ B fits in C
        AND ($4::text IS NULL OR b.bay_type = $4)
        AND NOT EXISTS (
          SELECT 1
          FROM bay_allocations ba
          WHERE ba.bay_id = b.bay_id
            AND ba.allocation_state IN ('PROPOSED','CONFIRMED')
            AND ba.planned_start_time < $3
            AND ba.planned_end_time   > $2
        )
      ORDER BY b.bay_id;
      `,
      [aircraftType, start, end, bayType]
    );

    res.json(rows);
  } catch (e) {
    console.error("bays/available error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
