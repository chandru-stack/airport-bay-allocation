import pool from "../../../../config/db.js";

/**
 * GET ALERTS
 */
export const getAlerts = async (req, res) => {
  try {
    const alerts = [];

    // 🔴 1. Active Emergency
    const emergency = await pool.query(`
      SELECT e.*, f.flight_number
      FROM emergency_events e
      JOIN flights f ON e.flight_id = f.flight_id
      WHERE e.status = 'ACTIVE'
    `);

    emergency.rows.forEach((e) => {
      alerts.push({
        id: `EM-${e.emergency_id}`,
        type: "Emergency Active",
        severity: "High",
        message: `Emergency declared for Flight ${e.flight_number}`,
        time: new Date(e.activated_at).toLocaleTimeString(),
      });
    });

    // 🟡 2. Bay Conflict
    const conflicts = await pool.query(`
      SELECT b.bay_id, f.flight_number
      FROM bay_allocations ba
      JOIN flights f ON ba.flight_id = f.flight_id
      JOIN bays b ON ba.bay_id = b.bay_id
      WHERE ba.conflict_flag = true
    `);

    conflicts.rows.forEach((c) => {
      alerts.push({
        id: `BC-${c.bay_id}`,
        type: "Bay Conflict",
        severity: "Medium",
        message: `Conflict detected at ${c.bay_id} for Flight ${c.flight_number}`,
        time: new Date().toLocaleTimeString(),
      });
    });

    // 🟡 3. Flights without allocation
    const unassigned = await pool.query(`
      SELECT flight_number
      FROM flights f
      WHERE NOT EXISTS (
        SELECT 1 FROM bay_allocations ba
        WHERE ba.flight_id = f.flight_id
        AND ba.allocation_state IN ('CONFIRMED','OCCUPIED')
      )
      AND movement_type = 'A'
    `);

    unassigned.rows.forEach((f) => {
      alerts.push({
        id: `UA-${f.flight_number}`,
        type: "Apron Not Ready",
        severity: "Medium",
        message: `No bay assigned for arriving Flight ${f.flight_number}`,
        time: new Date().toLocaleTimeString(),
      });
    });

    res.json(alerts);
  } catch (error) {
    console.error("Alert generation error:", error);
    res.status(500).json({ message: "Failed to generate alerts" });
  }
};