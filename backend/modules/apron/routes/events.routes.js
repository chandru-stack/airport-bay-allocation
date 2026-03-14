import express from "express";
import pool from "../../../config/db.js";

const router = express.Router();

/* GET latest events */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM events
      ORDER BY event_time DESC
      LIMIT 50
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch events" });
  }
});

export default router;
