import pool from "../../../../config/db.js";

/* =========================================
   GET ALL FLIGHTS
========================================= */
export const getFlights = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM flights ORDER BY scheduled_time"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get flights error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================
   GET INBOUND (ARRIVALS)
========================================= */
export const getInboundFlights = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        flight_id,
        flight_number,
        scheduled_time,
        estimated_time,
        assigned_runway,
        operational_status
      FROM flights
      WHERE movement_type = 'A'
      ORDER BY scheduled_time ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Inbound flights fetch error:", error);
    res.status(500).json({ message: "Failed to fetch inbound flights" });
  }
};

/* =========================================
   UPDATE FLIGHT STATUS (STRICT LIFECYCLE)
========================================= */
export const updateFlightStatus = async (req, res) => {
  const client = await pool.connect();

  try {
    const { flightId } = req.params;
    const { newStatus } = req.body;

    await client.query("BEGIN");

    /* -----------------------------------------
       1️⃣ Check Flight Exists
    ----------------------------------------- */
    const flightCheck = await client.query(
      `SELECT flight_id, movement_type, operational_status
       FROM flights
       WHERE flight_id = $1`,
      [flightId]
    );

    if (!flightCheck.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Flight not found."
      });
    }

    const flight = flightCheck.rows[0];

    /* -----------------------------------------
       2️⃣ Validate Departure Lifecycle
    ----------------------------------------- */
    if (newStatus === "CLEARED_FOR_TAKEOFF") {

      if (flight.movement_type !== "D") {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: "Only departure flights can be cleared for takeoff."
        });
      }

      const apronCheck = await client.query(
        `SELECT pushback_ready_time, off_block_time
         FROM apron_operations
         WHERE flight_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [flightId]
      );

      if (!apronCheck.rows.length) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: "No apron operation record found."
        });
      }

      const { pushback_ready_time, off_block_time } = apronCheck.rows[0];

      if (!pushback_ready_time) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: "Cannot clear for takeoff. Pushback not ready."
        });
      }

      if (!off_block_time) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: "Cannot clear for takeoff. Aircraft not off-block."
        });
      }
    }

    /* -----------------------------------------
       3️⃣ Update Flight Status
    ----------------------------------------- */
    await client.query(
      `UPDATE flights 
       SET operational_status = $1 
       WHERE flight_id = $2`,
      [newStatus, flightId]
    );

    await client.query("COMMIT");

    res.json({
      message: "Flight status updated successfully"
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update flight status error:", error);
    res.status(500).json({
      message: "Failed to update flight status"
    });
  } finally {
    client.release();
  }
};