import express from "express";
import pool from "../../../config/db.js";

const router = express.Router();

/* GET all bay allocations */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM bay_allocations
      ORDER BY planned_start_time
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch bay allocations" });
  }
});

export default router;
