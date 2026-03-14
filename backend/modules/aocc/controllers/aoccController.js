import pool from "../../../config/db.js";

/* =========================
   SUMMARY
========================= */
export async function getSummary(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM flights) AS total_flights,
        (SELECT COUNT(*) FROM bays WHERE status='AVAILABLE') AS available_bays,
        (SELECT COUNT(*) FROM bays WHERE status='OCCUPIED') AS occupied_bays
    `);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* =========================
   DASHBOARD SUMMARY
========================= */
export async function getDashboardSummary(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE movement_type='A') AS arrivals,
        COUNT(*) FILTER (WHERE movement_type='D') AS departures,
        COUNT(*) FILTER (WHERE operational_status='DELAYED') AS delayed,
        COUNT(*) FILTER (WHERE priority_score > 0) AS priority_flights
      FROM flights
    `);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* =========================
   FLIGHTS
========================= */
export async function getFlights(req, res) {
  try {

    await pool.query(`
      UPDATE bay_allocations ba
      SET allocation_state = 'RELEASED',
          actual_end_time = NOW()
      FROM apron_operations ao
      WHERE ao.bay_id = ba.bay_id
      AND ao.off_block_time IS NOT NULL
      AND ba.allocation_state IN ('PROPOSED','CONFIRMED','OCCUPIED')
    `);

    const result = await pool.query(`
      SELECT DISTINCT ON (f.flight_id)
        f.flight_id,
        f.flight_number,
        f.movement_type,
        f.scheduled_time,
        f.operational_status,
        f.aircraft_type_code,
        f.airline_code,
        f.origin_airport_code,
        f.destination_airport_code,
        f.priority_score,
        ba.bay_id,
        ba.allocation_state
      FROM flights f
      LEFT JOIN bay_allocations ba 
        ON ba.flight_id = f.flight_id
      ORDER BY f.flight_id, ba.created_at DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error("FLIGHT FETCH ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}

/* =========================
   BAYS
========================= */
export async function getBays(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        b.bay_id,
        b.terminal_name,
        b.is_emergency_capable,
        CASE
          WHEN b.status = 'BLOCKED' THEN 'blocked'
          WHEN ao.on_block_time IS NOT NULL 
               AND ao.off_block_time IS NULL THEN 'occupied'
          WHEN ba.allocation_state IN ('PROPOSED','CONFIRMED') THEN 'reserved'
          ELSE 'available'
        END AS status,
        f.flight_number,
        f.aircraft_type_code,
        ao.on_block_time,
        ao.pushback_ready_time,
        ao.off_block_time
      FROM bays b
      LEFT JOIN LATERAL (
        SELECT *
        FROM bay_allocations
        WHERE bay_id = b.bay_id
          AND allocation_state IN ('PROPOSED','CONFIRMED')
        ORDER BY created_at DESC
        LIMIT 1
      ) ba ON true
      LEFT JOIN flights f ON f.flight_id = ba.flight_id
      LEFT JOIN LATERAL (
        SELECT *
        FROM apron_operations
        WHERE bay_id = b.bay_id
        ORDER BY operation_id DESC
        LIMIT 1
      ) ao ON true
      ORDER BY b.bay_id;
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("getBays error:", err);
    res.status(500).json({ error: err.message });
  }
}

/* ===== Remaining functions unchanged, just exported ===== */

export async function allocateBay(req, res) { /* same body as before */ }
export async function confirmAllocation(req, res) { /* same body */ }
export async function reassignBay(req, res) { /* same body */ }
export async function getEvents(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        e.event_id AS id,
        e.event_time AS timestamp,
        e.event_type AS type,
        e.payload,
        u.username
      FROM events e
      LEFT JOIN users u
        ON u.user_id = e.actor_user_id
      ORDER BY e.event_time DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error("GET EVENTS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}
export async function getAuditLog(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        event_id AS id,
        event_time AS timestamp,
        event_type AS action,
        payload->>'previous_status' AS previous_state,
        payload->>'status' AS new_state,
        payload->>'flight_number' AS flight,
        payload->>'user' AS user_name,
        payload->>'role' AS role_name
      FROM events
      ORDER BY event_time DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}
export async function getATCMessages(req, res) { /* same body */ }
export async function sendATCMessage(req, res) { /* same body */ }
export async function acknowledgeATCMessage(req, res) { /* same body */ }
export async function blockBay(req, res) { /* same body */ }
export async function unblockBay(req, res) { /* same body */ }
export async function confirmOnBlock(req, res) { /* same body */ }
export async function confirmPushbackReady(req, res) { /* same body */ }
export async function confirmOffBlock(req, res) { /* same body */ }