import express from "express";
import pool from "../db/pool.js";

const router = express.Router();

/**
 * GET /api/airports?q=MAA
 * Returns airports for dropdown/search
 */
router.get("/", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim().toUpperCase();

    let sql = `
      SELECT airport_code, airport_name, city, country
      FROM airports
    `;
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      sql += ` WHERE airport_code ILIKE $1 OR airport_name ILIKE $1 OR city ILIKE $1 `;
    }

    sql += ` ORDER BY airport_code ASC LIMIT 100;`;

    const result = await pool.query(sql, params);
    res.json({ ok: true, airports: result.rows });
  } catch (err) {
    next(err);
  }
});

export default router;
