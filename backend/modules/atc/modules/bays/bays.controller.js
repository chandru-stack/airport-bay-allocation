import pool from "../../../../config/db.js";
import { broadcastEvent } from "../../../../config/websocket.js";

/* =========================================
   GET BAY VISIBILITY
========================================= */
export const getBayVisibility = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.bay_id,
        b.bay_name,
        b.bay_type,
        b.terminal_name,
        b.status AS bay_status,
        b.is_emergency_capable,
        alloc.allocation_state,
        alloc.conflict_flag,
        f.flight_number,
        f.movement_type,
        f.operational_status,
        ao.on_block_time,
        ao.off_block_time
      FROM bays b
      LEFT JOIN LATERAL (
        SELECT *
        FROM bay_allocations ba2
        WHERE ba2.bay_id = b.bay_id
          AND ba2.allocation_state IN ('CONFIRMED','OCCUPIED')
        ORDER BY ba2.created_at DESC
        LIMIT 1
      ) alloc ON true
      LEFT JOIN flights f
        ON alloc.flight_id = f.flight_id
      LEFT JOIN LATERAL (
        SELECT *
        FROM apron_operations ao2
        WHERE ao2.flight_id = f.flight_id
          AND ao2.off_block_time IS NULL
        ORDER BY ao2.created_at DESC
        LIMIT 1
      ) ao ON true
      ORDER BY b.bay_id;
    `);

    res.json(result.rows);

  } catch (error) {
    console.error("Bay Visibility Error:", error);
    res.status(500).json({ message: "Failed to fetch bays" });
  }
};


/* =========================================
   UPDATE BAY STATUS
========================================= */
export const updateBayStatus = async (req, res) => {
  const { bay_id, new_status, actor_user_id } = req.body;

  try {
    const current = await pool.query(
      `SELECT status FROM bays WHERE bay_id = $1`,
      [bay_id]
    );

    if (!current.rows.length) {
      return res.status(404).json({ message: "Bay not found" });
    }

    const currentStatus = current.rows[0].status;

    if (currentStatus === new_status) {
      return res.json({ message: "No status change" });
    }

    await pool.query(
      `UPDATE bays SET status = $1 WHERE bay_id = $2`,
      [new_status, bay_id]
    );

    await pool.query(
      `INSERT INTO events 
       (event_time, event_type, actor_user_id, flight_id, allocation_id, correlation_id, payload)
       VALUES (NOW(), $1, $2, NULL, NULL, gen_random_uuid(), $3)`,
      [
        "BAY_STATUS_CHANGED",
        actor_user_id,
        JSON.stringify({
          bay_id,
          previous_status: currentStatus,
          new_status
        })
      ]
    );

    broadcastEvent({
      type: "EVENT_CREATED",
      data: {
        event_type: "BAY_STATUS_CHANGED",
        bay_id,
        previous_status: currentStatus,
        new_status
      }
    });

    res.json({ message: "Bay status updated" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Update failed" });
  }
};