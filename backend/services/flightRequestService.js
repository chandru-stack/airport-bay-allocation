// src/services/flightRequestService.js
import pool from "../db/pool.js";

// Map numeric -> label for UI
function levelToLabel(level) {
  if (level >= 2) return "P1";
  if (level === 1) return "P2";
  return "P3";
}

async function ensureAirlineOwnsFlight(user, flightId) {
  if (user?.role_name !== "AIRLINE") return;

  const q = await pool.query(
    "SELECT 1 FROM flights WHERE flight_id = $1 AND airline_code = $2",
    [Number(flightId), user.airline_code]
  );

  if (q.rowCount === 0) {
    const err = new Error("Invalid flight_id");
    err.statusCode = 400;
    throw err;
  }
}

async function ensureAirlineOwnsRequest(user, requestId) {
  if (user?.role_name !== "AIRLINE") return;

  const q = await pool.query(
    `SELECT 1
     FROM flight_requests fr
     JOIN flights f ON f.flight_id = fr.flight_id
     WHERE fr.request_id = $1 AND f.airline_code = $2`,
    [Number(requestId), user.airline_code]
  );

  if (q.rowCount === 0) {
    const err = new Error("Request not found");
    err.statusCode = 404;
    throw err;
  }
}

export async function listFlightRequests(user) {
  const params = [];
  let where = " WHERE 1=1 ";

  if (user?.role_name === "AIRLINE") {
    params.push(user.airline_code);
    where += ` AND f.airline_code = $${params.length} `;
  }

  const sql = `
    SELECT
      fr.request_id AS "requestId",
      fr.flight_id AS "flightId",
      fr.preferred_bay_id AS "requestedBay",
      fr.requested_extra_minutes AS "extraMinutes",
      fr.requested_priority_level AS "priorityLevel",
      fr.reason,
      fr.request_status AS status,
      fr.created_at AS "createdAt",
      fr.updated_at AS "updatedAt"
    FROM flight_requests fr
    JOIN flights f ON f.flight_id = fr.flight_id
    ${where}
    ORDER BY fr.created_at DESC
    LIMIT 500;
  `;

  const r = await pool.query(sql, params);

  return r.rows.map((x) => ({
    ...x,
    priority: levelToLabel(x.priorityLevel),
    bayType: x.requestedBay ? "PREFERRED" : "ANY",
    assignedBay: null,
  }));
}

export async function createFlightRequest(user, data) {
  const {
    flight_id,
    requested_priority_level,
    preferred_bay_id,
    requested_extra_minutes,
    reason,
  } = data;

  await ensureAirlineOwnsFlight(user, flight_id);

  const sql = `
    INSERT INTO flight_requests (
      flight_id,
      preferred_bay_id,
      requested_extra_minutes,
      requested_priority_level,
      reason,
      request_status
    )
    VALUES ($1,$2,$3,$4,$5,'PENDING')
    RETURNING
      request_id AS "requestId",
      flight_id AS "flightId",
      preferred_bay_id AS "requestedBay",
      requested_extra_minutes AS "extraMinutes",
      requested_priority_level AS "priorityLevel",
      reason,
      request_status AS status,
      created_at AS "createdAt",
      updated_at AS "updatedAt";
  `;

  const r = await pool.query(sql, [
    Number(flight_id),
    preferred_bay_id ?? null,
    requested_extra_minutes ?? 0,
    requested_priority_level ?? 0,
    reason ?? null,
  ]);

  const row = r.rows[0];
  return {
    ...row,
    priority: levelToLabel(row.priorityLevel),
    bayType: row.requestedBay ? "PREFERRED" : "ANY",
    assignedBay: null,
  };
}

export async function updateFlightRequest(user, requestId, patch) {
  await ensureAirlineOwnsRequest(user, requestId);

  const allowed = {
    preferred_bay_id: "preferred_bay_id",
    requested_extra_minutes: "requested_extra_minutes",
    requested_priority_level: "requested_priority_level",
    reason: "reason",
    request_status: "request_status",
  };

  const sets = [];
  const values = [];
  let idx = 1;

  for (const key of Object.keys(allowed)) {
    if (patch[key] !== undefined) {
      sets.push(`${allowed[key]} = $${idx++}`);
      values.push(patch[key]);
    }
  }

  if (!sets.length) {
    const err = new Error("No valid fields to update");
    err.statusCode = 400;
    throw err;
  }

  values.push(Number(requestId));

  const sql = `
    UPDATE flight_requests
    SET ${sets.join(", ")}
    WHERE request_id = $${idx}
    RETURNING
      request_id AS "requestId",
      flight_id AS "flightId",
      preferred_bay_id AS "requestedBay",
      requested_extra_minutes AS "extraMinutes",
      requested_priority_level AS "priorityLevel",
      reason,
      request_status AS status,
      created_at AS "createdAt",
      updated_at AS "updatedAt";
  `;

  const r = await pool.query(sql, values);
  const row = r.rows[0];
  if (!row) {
    const err = new Error("Request not found");
    err.statusCode = 404;
    throw err;
  }

  return {
    ...row,
    priority: levelToLabel(row.priorityLevel),
    bayType: row.requestedBay ? "PREFERRED" : "ANY",
    assignedBay: null,
  };
}
