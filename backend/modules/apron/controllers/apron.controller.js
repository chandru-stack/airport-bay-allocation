import pool from "../../../config/db.js";

export const handleLifecycleEvent = async (req, res) => {
  const { bay_id, flight_number, event } = req.body;

  try {
    await pool.query("BEGIN");

    /* ===== GET FLIGHT ===== */
    const flightRes = await pool.query(
      "SELECT flight_id FROM flights WHERE flight_number = $1",
      [flight_number]
    );

    if (flightRes.rowCount === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ message: "Flight not found" });
    }

    const flight_id = flightRes.rows[0].flight_id;

    /* ===== GET LATEST ALLOCATION ===== */
    const allocationRes = await pool.query(`
      SELECT allocation_id, allocation_state
      FROM bay_allocations
      WHERE flight_id = $1
        AND bay_id = $2
      ORDER BY created_at DESC
      LIMIT 1
    `, [flight_id, bay_id]);

    if (allocationRes.rowCount === 0) {
      await pool.query("ROLLBACK");
      return res.status(400).json({ message: "No allocation found" });
    }

    const latestAllocation = allocationRes.rows[0];

    /* ================= ON_BLOCK ================= */
    if (event === "ON_BLOCK") {

      if (latestAllocation.allocation_state !== "CONFIRMED") {
        await pool.query("ROLLBACK");
        return res.status(400).json({
          message: "ON_BLOCK allowed only when allocation is CONFIRMED"
        });
      }

      await pool.query(`
        INSERT INTO apron_operations (flight_id, bay_id, on_block_time)
        VALUES ($1, $2, NOW())
      `, [flight_id, bay_id]);

      await pool.query(`
        UPDATE flights
        SET operational_status = 'ON_BLOCK'
        WHERE flight_id = $1
      `, [flight_id]);

      await pool.query(`
        UPDATE bay_allocations
        SET allocation_state = 'OCCUPIED',
            actual_start_time = NOW()
        WHERE allocation_id = $1
      `, [latestAllocation.allocation_id]);
    }

    /* ================= PUSHBACK_READY ================= */
    if (event === "PUSHBACK_READY") {

      if (latestAllocation.allocation_state !== "OCCUPIED") {
        await pool.query("ROLLBACK");
        return res.status(400).json({
          message: "PUSHBACK_READY allowed only when OCCUPIED"
        });
      }

      await pool.query(`
        UPDATE apron_operations
        SET pushback_ready_time = NOW()
        WHERE flight_id = $1
          AND bay_id = $2
          AND pushback_ready_time IS NULL
      `, [flight_id, bay_id]);

      await pool.query(`
        UPDATE flights
        SET operational_status = 'READY_FOR_DEPARTURE'
        WHERE flight_id = $1
      `, [flight_id]);
    }

    /* ================= OFF_BLOCK ================= */
    if (event === "OFF_BLOCK") {

      if (latestAllocation.allocation_state !== "OCCUPIED") {
        await pool.query("ROLLBACK");
        return res.status(400).json({
          message: "OFF_BLOCK allowed only when OCCUPIED"
        });
      }

      await pool.query(`
        UPDATE apron_operations
        SET off_block_time = NOW()
        WHERE flight_id = $1
          AND bay_id = $2
          AND off_block_time IS NULL
      `, [flight_id, bay_id]);

      await pool.query(`
        UPDATE flights
        SET operational_status = 'OFF_BLOCK'
        WHERE flight_id = $1
      `, [flight_id]);

      await pool.query(`
        UPDATE bay_allocations
        SET allocation_state = 'RELEASED',
            actual_end_time = NOW()
        WHERE allocation_id = $1
      `, [latestAllocation.allocation_id]);
    }

    await pool.query("COMMIT");

    res.json({ message: "Lifecycle updated successfully" });

  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Lifecycle error:", err);
    res.status(500).json({ error: err.message });
  }
};