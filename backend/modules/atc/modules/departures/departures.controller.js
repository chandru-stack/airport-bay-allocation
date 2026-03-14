import pool from "../../../../config/db.js";
import { v4 as uuidv4 } from "uuid";
import { broadcastEvent } from "../../../../config/websocket.js";

/* =========================================
   GET DEPARTURE QUEUE (CLEAN + DISTINCT)
========================================= */
export const getDepartures = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (f.flight_id)
        f.*,
        b.bay_name,
        ba.allocation_state,
        ao.pushback_ready_time,
        ao.off_block_time
      FROM flights f
      LEFT JOIN bay_allocations ba
        ON ba.flight_id = f.flight_id
       AND ba.allocation_state = 'CONFIRMED'
      LEFT JOIN bays b
        ON b.bay_id = ba.bay_id
      LEFT JOIN apron_operations ao
        ON ao.flight_id = f.flight_id
      WHERE f.movement_type = 'D'
        AND ba.allocation_state = 'CONFIRMED'
      ORDER BY f.flight_id
    `);

    res.json(result.rows);

  } catch (error) {
    console.error("Departure Fetch Error:", error);
    res.status(500).json({ message: "Failed to fetch departures" });
  }
};


/* =========================================
   UPDATE DEPARTURE STATUS (STRICT LIFECYCLE)
========================================= */
export const updateDepartureStatus = async (req, res) => {
  const { flight_id, new_status, actor_user_id } = req.body;

  if (new_status !== "CLEARED_FOR_TAKEOFF") {
    return res.status(403).json({
      message: "ATC can only clear for takeoff."
    });
  }

  const client = await pool.connect();

  try {
    const correlation_id = uuidv4();

    await client.query("BEGIN");

    const apronCheck = await client.query(
      `
      SELECT pushback_ready_time, off_block_time
      FROM apron_operations
      WHERE flight_id = $1
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [flight_id]
    );

    if (
      !apronCheck.rows.length ||
      !apronCheck.rows[0].pushback_ready_time ||
      !apronCheck.rows[0].off_block_time
    ) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Cannot clear for takeoff. Aircraft not pushback completed."
      });
    }

    await client.query(
      `
      UPDATE flights
      SET operational_status = $1
      WHERE flight_id = $2
      `,
      [new_status, flight_id]
    );

    await client.query(
      `
      INSERT INTO events
      (event_time, event_type, actor_user_id, flight_id, allocation_id, correlation_id, payload)
      VALUES (NOW(), $1, $2, $3, NULL, $4, $5)
      `,
      [
        `DEPARTURE_STATUS_${new_status}`,
        actor_user_id,
        flight_id,
        correlation_id,
        JSON.stringify({ status: new_status })
      ]
    );

    await client.query("COMMIT");

    broadcastEvent({
      type: "EVENT_CREATED",
      data: {
        event_type: `DEPARTURE_STATUS_${new_status}`,
        flight_id
      }
    });

    res.json({ message: `Departure updated to ${new_status}` });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Departure Update Error:", error);
    res.status(500).json({ message: "Departure update failed" });
  } finally {
    client.release();
  }
};