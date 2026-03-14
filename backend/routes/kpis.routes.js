// src/routes/kpis.routes.js
import express from "express";
import pool from "../db/pool.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const user = req.user;

    // flights count (scoped for airline)
    let flightSql = "SELECT COUNT(*)::int AS count FROM flights";
    const flightVals = [];
    if (user?.role_name === "AIRLINE") {
      flightVals.push(user.airline_code);
      flightSql += " WHERE airline_code = $1";
    }
    const totalFlights = await pool.query(flightSql, flightVals);

    // delayed flights (if operational_status exists)
    let delayedSql = "SELECT COUNT(*)::int AS count FROM flights WHERE operational_status = 'DELAYED'";
    const delayedVals = [];
    if (user?.role_name === "AIRLINE") {
      delayedVals.push(user.airline_code);
      delayedSql += " AND airline_code = $1";
    }
    const delayed = await pool.query(delayedSql, delayedVals);

    // pending requests (scoped via join)
    let pendingSql = `
      SELECT COUNT(*)::int AS count
      FROM flight_requests fr
      JOIN flights f ON f.flight_id = fr.flight_id
      WHERE fr.request_status = 'PENDING'
    `;
    const pendingVals = [];
    if (user?.role_name === "AIRLINE") {
      pendingVals.push(user.airline_code);
      pendingSql += " AND f.airline_code = $1";
    }
    const pendingReq = await pool.query(pendingSql, pendingVals);

    // P1 requests (level >= 2)
    let p1Sql = `
      SELECT COUNT(*)::int AS count
      FROM flight_requests fr
      JOIN flights f ON f.flight_id = fr.flight_id
      WHERE fr.requested_priority_level >= 2
    `;
    const p1Vals = [];
    if (user?.role_name === "AIRLINE") {
      p1Vals.push(user.airline_code);
      p1Sql += " AND f.airline_code = $1";
    }
    const p1Req = await pool.query(p1Sql, p1Vals);

    res.json({
      ok: true,
      kpis: {
        totalFlights: totalFlights.rows[0]?.count ?? 0,
        delayedFlights: delayed.rows[0]?.count ?? 0,
        pendingRequests: pendingReq.rows[0]?.count ?? 0,
        p1Requests: p1Req.rows[0]?.count ?? 0,
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
