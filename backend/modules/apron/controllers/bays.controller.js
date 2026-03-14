import pool from "../../../config/db.js";

/* =======================================================
   UPDATE BAY STATUS
======================================================= */
export const updateBayStatus = async (req, res) => {
  const { bayId } = req.params;
  const { newStatus, remarks } = req.body;

  try {
    await pool.query("BEGIN");

    // 1️⃣ Check bay exists
    const bayCheck = await pool.query(
      `SELECT bay_id FROM bays WHERE bay_id = $1`,
      [bayId]
    );

    if (bayCheck.rowCount === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ error: "Bay not found" });
    }

    // 2️⃣ Update bay status
    await pool.query(
      `UPDATE bays SET status = $1 WHERE bay_id = $2`,
      [newStatus.toUpperCase(), bayId]
    );

    // 3️⃣ Insert apron event
    await pool.query(
      `INSERT INTO events (event_type, event_time, payload)
       VALUES ($1, NOW(), $2)`,
      [
        `BAY_${newStatus.toUpperCase()}`,
        JSON.stringify({
          bay_id: bayId,
          status: newStatus,
          remarks,
          source: "APRON_UI"
        })
      ]
    );

    await pool.query("COMMIT");

    res.json({ success: true });

  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("❌ updateBayStatus error:", err);
    res.status(500).json({ error: "Failed to update bay status" });
  }
};


/* =======================================================
   ✅ GET FLIGHT DETAILS BY BAY
   This is what your popup will use
======================================================= */
export const getBayFlightDetails = async (req, res) => {
  const { bayId } = req.params;

  try {
    const result = await pool.query(`
  SELECT 
    f.flight_number,
    f.aircraft_type_code AS aircraft_type,
    ba.planned_start_time AS on_block_time,
    ba.planned_end_time   AS off_block_time
  FROM bay_allocations ba
  JOIN flights f ON ba.flight_id = f.flight_id
  WHERE ba.bay_id = $1
    AND ba.allocation_state IN ('PROPOSED','CONFIRMED')
  ORDER BY ba.created_at DESC
  LIMIT 1
`, [bayId]);

    if (result.rowCount === 0) {
      return res.status(200).json(null);
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error("Error fetching bay flight details:", err);
    res.status(500).json({ error: "Failed to fetch flight details" });
  }
};
export const getAllBays = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        b.bay_id,
        b.terminal_name,

        CASE
  WHEN b.status = 'BLOCKED' THEN 'blocked'

  /* If lifecycle finished → AVAILABLE */
  WHEN ao.off_block_time IS NOT NULL THEN 'available'

  /* If aircraft currently at bay */
  WHEN ao.on_block_time IS NOT NULL 
       AND ao.off_block_time IS NULL THEN 'occupied'

  /* Only planning stage */
  WHEN la.allocation_state IN ('PROPOSED','CONFIRMED') THEN 'reserved'

  ELSE 'available'
END AS status,

        CASE
          WHEN la.allocation_state IN ('PROPOSED','CONFIRMED')
               OR (ao.on_block_time IS NOT NULL AND ao.off_block_time IS NULL)
          THEN f.flight_number
          ELSE NULL
        END AS "flightNumber",

        CASE
          WHEN la.allocation_state IN ('PROPOSED','CONFIRMED')
               OR (ao.on_block_time IS NOT NULL AND ao.off_block_time IS NULL)
          THEN f.aircraft_type_code
          ELSE NULL
        END AS "aircraftType",

        ao.on_block_time   AS "onBlockTime",
        ao.pushback_ready_time AS "pushbackReadyTime",
        ao.off_block_time  AS "offBlockTime"

      FROM bays b

      /* Latest allocation per bay */
      LEFT JOIN LATERAL (
        SELECT *
        FROM bay_allocations ba
        WHERE ba.bay_id = b.bay_id
        ORDER BY ba.created_at DESC
        LIMIT 1
      ) la ON true

      LEFT JOIN flights f
        ON f.flight_id = la.flight_id

      /* Latest apron operation per bay */
      LEFT JOIN LATERAL (
        SELECT *
        FROM apron_operations ao
        WHERE ao.bay_id = b.bay_id
        ORDER BY ao.operation_id DESC
        LIMIT 1
      ) ao ON true

      ORDER BY b.bay_id;
    `);

    res.json(result.rows);

  } catch (err) {
    console.error("❌ Failed to fetch bays:", err);
    res.status(500).json({ error: err.message });
  }
};
export const toggleBlockBay = async (req, res) => {
  const { bayId } = req.params;
  const { block } = req.body;

  try {
    if (block) {
      // Prevent blocking if flight active
      const activeCheck = await pool.query(`
        SELECT 1
        FROM bay_allocations
        WHERE bay_id = $1
        AND allocation_state IN ('CONFIRMED')
      `, [bayId]);

      if (activeCheck.rowCount > 0) {
        return res.status(400).json({
          error: "Cannot block bay with active allocation"
        });
      }
    }

    await pool.query(
      "UPDATE bays SET status = $1 WHERE bay_id = $2",
      [block ? "BLOCKED" : "AVAILABLE", bayId]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("Block toggle error:", err);
    res.status(500).json({ error: err.message });
  }
};