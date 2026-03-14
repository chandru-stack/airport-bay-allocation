import pool from "../../../../config/db.js";
import { broadcastEvent } from "../../../../config/websocket.js";
import { v4 as uuidv4 } from "uuid";

/*
===========================================
ACTIVATE EMERGENCY
===========================================
*/
export const activateEmergency = async (req, res) => {
  const { flight_id, emergency_type, activated_by } = req.body;

  try {
    const flightCheck = await pool.query(
      `SELECT * FROM flights WHERE flight_id = $1`,
      [flight_id]
    );

    if (!flightCheck.rows.length) {
      return res.status(404).json({ message: "Flight not found" });
    }

    const emergencyInsert = await pool.query(
      `
      INSERT INTO emergency_events
      (flight_id, emergency_type, priority_level, activated_by, status)
      VALUES ($1, $2, 1, $3, 'ACTIVE')
      RETURNING *
      `,
      [flight_id, emergency_type, activated_by]
    );

    await pool.query(
      `
      UPDATE flights
      SET priority_score = 1
      WHERE flight_id = $1
      `,
      [flight_id]
    );

    const correlation_id = uuidv4();

    await pool.query(
      `
      INSERT INTO events
      (event_time, event_type, actor_user_id, flight_id, allocation_id, correlation_id, payload)
      VALUES (NOW(), $1, $2, $3, NULL, $4, $5)
      `,
      [
        "EMERGENCY_ACTIVATED",
        activated_by,
        flight_id,
        correlation_id,
        JSON.stringify({ emergency_type })
      ]
    );

    broadcastEvent({
      type: "EMERGENCY_ACTIVATED",
      data: {
        flight_id,
        emergency_type
      }
    });

    res.json({
      message: "Emergency activated",
      emergency: emergencyInsert.rows[0]
    });

  } catch (error) {
    console.error("Emergency Activation Error:", error);
    res.status(500).json({ message: "Emergency activation failed" });
  }
};


/*
===========================================
GET ACTIVE EMERGENCIES
===========================================
*/
export const getActiveEmergencies = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, f.flight_number
      FROM emergency_events e
      JOIN flights f ON e.flight_id = f.flight_id
      WHERE e.status = 'ACTIVE'
      ORDER BY e.activated_at DESC
    `);

    res.json(result.rows);

  } catch (error) {
    console.error("Active emergency fetch error:", error);
    res.status(500).json({ message: "Failed to fetch emergencies" });
  }
};