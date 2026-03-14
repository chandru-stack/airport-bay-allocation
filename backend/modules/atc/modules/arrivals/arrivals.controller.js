import pool from "../../../../config/db.js";
import { v4 as uuidv4 } from "uuid";
import { broadcastEvent } from "../../../../config/websocket.js";

/* =========================================
   GET ARRIVAL QUEUE
========================================= */
export const getArrivals = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        f.*,
        b.bay_id,
        b.bay_name,
        ba.allocation_state
      FROM flights f
      LEFT JOIN bay_allocations ba 
        ON f.flight_id = ba.flight_id
        AND ba.allocation_state IN ('CONFIRMED','ACTIVE')
      LEFT JOIN bays b 
        ON ba.bay_id = b.bay_id
      WHERE f.movement_type = 'A'
        AND f.operational_status IN (
          'SCHEDULED',
          'ENROUTE',
          'HOLDING',
          'CLEARED_TO_LAND'
        )
      ORDER BY f.priority_score DESC, f.scheduled_time ASC
    `);

    res.json(result.rows);

  } catch (error) {
    console.error("Arrival Fetch Error:", error);
    res.status(500).json({ message: "Failed to fetch arrivals" });
  }
};


/* =========================================
   UPDATE ARRIVAL STATUS
========================================= */
export const updateArrivalStatus = async (req, res) => {
  const { flight_id, new_status, actor_user_id } = req.body;

  try {
    const correlation_id = uuidv4();

    await pool.query(
      `
      UPDATE flights
      SET operational_status = $1
      WHERE flight_id = $2
      `,
      [new_status, flight_id]
    );

    await pool.query(
      `
      INSERT INTO events
      (event_time, event_type, actor_user_id, flight_id, allocation_id, correlation_id, payload)
      VALUES (NOW(), $1, $2, $3, NULL, $4, $5)
      `,
      [
        `ARRIVAL_STATUS_${new_status}`,
        actor_user_id,
        flight_id,
        correlation_id,
        JSON.stringify({ status: new_status })
      ]
    );

    broadcastEvent({
      type: "ARRIVAL_STATUS_UPDATED",
      flight_id,
      new_status,
      correlation_id
    });

    res.json({ message: `Arrival updated to ${new_status}` });

  } catch (error) {
    console.error("Arrival Update Error:", error);
    res.status(500).json({ message: "Arrival update failed" });
  }
};