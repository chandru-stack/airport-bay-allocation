import pool from "../../../../config/db.js";
import { broadcastEvent } from "../../../../config/websocket.js";
import { v4 as uuidv4 } from "uuid";

/* =========================================
   1️⃣ GET PENDING REQUESTS
========================================= */
export const getPendingRequests = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT fr.*, f.flight_number, b.bay_name
      FROM flight_requests fr
      JOIN flights f ON fr.flight_id = f.flight_id
      LEFT JOIN bays b ON fr.preferred_bay_id = b.bay_id
      WHERE fr.request_status = 'PENDING'
      ORDER BY fr.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Pending requests error:", error);
    res.status(500).json({ message: "Failed to fetch requests" });
  }
};

/* =========================================
   2️⃣ APPROVE REQUEST
========================================= */
export const approveRequest = async (req, res) => {
  const { request_id, ao_user_id } = req.body;

  try {
    const request = await pool.query(
      `SELECT * FROM flight_requests WHERE request_id = $1`,
      [request_id]
    );

    if (!request.rows.length) {
      return res.status(404).json({ message: "Request not found" });
    }

    const data = request.rows[0];

    await pool.query(
      `
      INSERT INTO bay_allocations
      (flight_id, bay_id, allocation_state, planned_start_time, planned_end_time, allocation_reason)
      VALUES ($1, $2, 'CONFIRMED', NOW(), NOW() + interval '2 hour', 'AOCC Approved')
      `,
      [data.flight_id, data.preferred_bay_id]
    );

    await pool.query(
      `
      UPDATE flight_requests
      SET request_status = 'APPROVED',
          decided_by_user_id = $1,
          decided_at = NOW()
      WHERE request_id = $2
      `,
      [ao_user_id, request_id]
    );

    await pool.query(
      `
      INSERT INTO events
      (event_time, event_type, actor_user_id, flight_id, correlation_id, payload)
      VALUES (NOW(), 'BAY_REQUEST_APPROVED', $1, $2, $3, $4)
      `,
      [
        ao_user_id,
        data.flight_id,
        uuidv4(),
        JSON.stringify({ bay_id: data.preferred_bay_id })
      ]
    );

    broadcastEvent({
      type: "EVENT_CREATED",
      data: { event_type: "BAY_REQUEST_APPROVED" }
    });

    res.json({ message: "Request approved" });

  } catch (error) {
    console.error("Approve error:", error);
    res.status(500).json({ message: "Approval failed" });
  }
};

/* =========================================
   3️⃣ REJECT REQUEST
========================================= */
export const rejectRequest = async (req, res) => {
  const { request_id, ao_user_id } = req.body;

  try {
    await pool.query(
      `
      UPDATE flight_requests
      SET request_status = 'REJECTED',
          decided_by_user_id = $1,
          decided_at = NOW()
      WHERE request_id = $2
      `,
      [ao_user_id, request_id]
    );

    broadcastEvent({
      type: "EVENT_CREATED",
      data: { event_type: "BAY_REQUEST_REJECTED" }
    });

    res.json({ message: "Request rejected" });

  } catch (error) {
    console.error("Reject error:", error);
    res.status(500).json({ message: "Rejection failed" });
  }
};

export const createRequest = async (req, res) => {
  const { flight_id, message_type, message_text, atc_user_id } = req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO flight_requests
      (flight_id, request_type, message_text, request_status, requested_by_user_id)
      VALUES ($1, $2, $3, 'PENDING', $4)
      RETURNING *
      `,
      [flight_id, message_type, message_text, atc_user_id]
    );

    broadcastEvent({
      type: "EVENT_CREATED",
      data: { event_type: "BAY_REQUEST_CREATED" }
    });

    res.json(result.rows[0]);

  } catch (error) {
    console.error("Create request error:", error);
    res.status(500).json({ message: "Request creation failed" });
  }
};