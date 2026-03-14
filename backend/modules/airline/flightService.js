// src/services/flightService.js
import pool from "../../config/db.js";

const SYSTEM_AIRPORT = "IXM";

/**
 * Helper: scope by airline for AIRLINE role.
 * NOTE: For now AOCC/others are not enforced (you will add later).
 */
function airlineScopeWhere(user, params, tableAlias = "f") {
  if (user?.role_name === "AIRLINE") {
    if (!user.airline_code) {
      const err = new Error("AIRLINE user missing airline_code");
      err.statusCode = 401;
      throw err;
    }
    params.push(user.airline_code);
    return ` AND ${tableAlias}.airline_code = $${params.length} `;
  }
  return "";
}

async function ensureAirlineOwnsFlight(user, flightId) {
  if (user?.role_name !== "AIRLINE") return;

  const q = await pool.query(
    "SELECT 1 FROM flights WHERE flight_id = $1 AND airline_code = $2",
    [Number(flightId), user.airline_code]
  );

  if (q.rowCount === 0) {
    const err = new Error("Flight not found");
    err.statusCode = 404;
    throw err;
  }
}

/**
 * Create flight movement
 * For AIRLINE role, airline_code is taken from token (client input is ignored).
 */
export async function createFlight(user, data) {
  const {
    airline_code,
    flight_number,
    movement_type,
    flight_date,
    scheduled_time,
    estimated_time,
    aircraft_type_code,
    origin_airport_code,
    destination_airport_code,
  } = data;

  const finalAirlineCode =
    user?.role_name === "AIRLINE" ? user.airline_code : airline_code;

  if (!finalAirlineCode) {
    const err = new Error("airline_code is required");
    err.statusCode = 400;
    throw err;
  }

  const finalOrigin =
    movement_type === "D" ? SYSTEM_AIRPORT : origin_airport_code;

  const finalDestination =
    movement_type === "A" ? SYSTEM_AIRPORT : destination_airport_code;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const flightResult = await client.query(
      `
      INSERT INTO flights (
        airline_code,
        flight_number,
        movement_type,
        flight_date,
        scheduled_time,
        estimated_time,
        aircraft_type_code,
        origin_airport_code,
        destination_airport_code,
        operational_status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'SCHEDULED')
      RETURNING
        flight_id AS id,
        airline_code AS "airlineCode",
        flight_number AS "flightNumber",
        movement_type AS movement,
        origin_airport_code AS "originIata",
        destination_airport_code AS "destinationIata",
        flight_date AS "flightDate",
        scheduled_time AS "scheduledTime",
        estimated_time AS "estimatedTime",
        aircraft_type_code AS "aircraftType",
        operational_status AS status,
        priority_score AS "priorityScore";
      `,
      [
        finalAirlineCode,
        flight_number,
        movement_type,
        flight_date,
        scheduled_time,
        estimated_time || null,
        aircraft_type_code,
        finalOrigin,
        finalDestination,
      ]
    );

    const flight = flightResult.rows[0];

    // Optional: events table might exist; don't hard-fail if it doesn't.
    try {
      await client.query(
        `
        INSERT INTO events (event_type, actor_user_id, flight_id, payload)
        VALUES ($1, $2, $3, $4::jsonb);
        `,
        [
          "FLIGHT_CREATED",
          user?.user_id ?? null,
          flight.id,
          JSON.stringify({
            source: "AIRLINE_UI",
            movement_type,
            scheduled_time,
            estimated_time: estimated_time || null,
            origin_airport_code: finalOrigin,
            destination_airport_code: finalDestination,
          }),
        ]
      );
    } catch {
      // ignore if events table isn't present
    }

    await client.query("COMMIT");
    return flight;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * List flights (scoped for AIRLINE)
 */
export async function listFlights(user, filters = {}) {
  const { from, to, movement_type } = filters;

  let sql = `
    SELECT
      flight_id AS id,
      airline_code AS "airlineCode",
      flight_number AS "flightNumber",
      movement_type AS movement,
      flight_date AS "flightDate",
      origin_airport_code AS "originIata",
      destination_airport_code AS "destinationIata",
      scheduled_time AS "scheduledTime",
      estimated_time AS "estimatedTime",
      actual_time AS "actualTime",
      aircraft_type_code AS "aircraftType",
      operational_status AS status,
      priority_score AS "priorityScore"
    FROM flights f
    WHERE 1=1
  `;

  const params = [];

  if (from) {
    params.push(from);
    sql += ` AND f.origin_airport_code = $${params.length}`;
  }
  if (to) {
    params.push(to);
    sql += ` AND f.destination_airport_code = $${params.length}`;
  }
  if (movement_type && movement_type !== "ALL") {
    params.push(movement_type);
    sql += ` AND f.movement_type = $${params.length}`;
  }

  sql += airlineScopeWhere(user, params, "f");
  sql += ` ORDER BY f.scheduled_time DESC;`;

  const result = await pool.query(sql, params);
  return result.rows;
}

/**
 * Update flight (AIRLINE can update only their own flight)
 */
export async function updateFlight(user, flightId, patch) {
  await ensureAirlineOwnsFlight(user, flightId);

  // allow only specific fields (OWASP: prevent mass assignment)
  const allowed = {
    flight_number: "flight_number",
    movement_type: "movement_type",
    flight_date: "flight_date",
    scheduled_time: "scheduled_time",
    estimated_time: "estimated_time",
    aircraft_type_code: "aircraft_type_code",
    operational_status: "operational_status",
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

  // keep flight_date in sync when only scheduled_time changed
  if (patch.scheduled_time !== undefined && patch.flight_date === undefined) {
    sets.push(`flight_date = ($${idx++}::timestamp)::date`);
    values.push(patch.scheduled_time);
  }

  if (!sets.length) {
    const err = new Error("No valid fields to update");
    err.statusCode = 400;
    throw err;
  }

  values.push(flightId);

  let where = ` WHERE flight_id = $${idx} `;
  if (user?.role_name === "AIRLINE") {
    idx += 1;
    values.push(user.airline_code);
    where += ` AND airline_code = $${idx} `;
  }

  const sql = `
    UPDATE flights
    SET ${sets.join(", ")}
    ${where}
    RETURNING
      flight_id AS id,
      airline_code AS "airlineCode",
      flight_number AS "flightNumber",
      movement_type AS movement,
      flight_date AS "flightDate",
      origin_airport_code AS "originIata",
      destination_airport_code AS "destinationIata",
      scheduled_time AS "scheduledTime",
      estimated_time AS "estimatedTime",
      aircraft_type_code AS "aircraftType",
      operational_status AS status,
      priority_score AS "priorityScore";
  `;

  const result = await pool.query(sql, values);
  if (!result.rows[0]) {
    const err = new Error("Flight not found");
    err.statusCode = 404;
    throw err;
  }
  return result.rows[0];
}

/**
 * Delete a flight (AIRLINE can delete only their own)
 */
export async function deleteFlight(user, flightId) {
  const params = [flightId];
  let sql = "DELETE FROM flights WHERE flight_id = $1";
  if (user?.role_name === "AIRLINE") {
    params.push(user.airline_code);
    sql += " AND airline_code = $2";
  }
  const r = await pool.query(sql, params);
  if (r.rowCount === 0) {
    const err = new Error("Flight not found");
    err.statusCode = 404;
    throw err;
  }
}

/**
 * Bulk upsert flights from parsed CSV rows.
 * For AIRLINE role, airline_code is forced from token and NOT taken from file.
 */
export async function upsertFlightsFromCsvRows(user, rows) {
  let inserted = 0;
  let updated = 0;
  let failed = 0;

  const finalAirlineCode =
    user?.role_name === "AIRLINE" ? user.airline_code : null;

  if (!finalAirlineCode) {
    const err = new Error("Bulk upload is allowed only for AIRLINE role for now");
    err.statusCode = 403;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const row of rows) {
      try {
        const flight_number = String(row.flight_number || "").toUpperCase();
        const movement_type = String(row.movement_type || "A").toUpperCase();
        const flight_date = row.flight_date; // YYYY-MM-DD
        const scheduled_time = row.scheduled_time; // ISO string recommended
        const estimated_time = row.estimated_time || null;
        const aircraft_type_code = String(row.aircraft_type_code || "").toUpperCase();

        if (!flight_number || !flight_date || !scheduled_time || !aircraft_type_code) {
          failed++;
          continue;
        }

        const finalOrigin =
          movement_type === "D" ? SYSTEM_AIRPORT : String(row.origin_airport_code || SYSTEM_AIRPORT).toUpperCase();

        const finalDestination =
          movement_type === "A" ? SYSTEM_AIRPORT : String(row.destination_airport_code || SYSTEM_AIRPORT).toUpperCase();

        // Requires a UNIQUE constraint on (airline_code, flight_number, flight_date, movement_type)
        // If your DB currently has UNIQUE on (flight_number, flight_date, movement_type) only,
        // airlines might collide. We still upsert safely within your airline by updating only matching airline rows.
        const r = await client.query(
          `
          INSERT INTO flights (
            airline_code,
            flight_number,
            flight_date,
            movement_type,
            scheduled_time,
            estimated_time,
            aircraft_type_code,
            origin_airport_code,
            destination_airport_code,
            operational_status
          )
          VALUES ($1,$2,$3::date,$4,$5,$6,$7,$8,$9,'SCHEDULED')
          ON CONFLICT (flight_number, flight_date, movement_type)
          DO UPDATE SET
            scheduled_time = EXCLUDED.scheduled_time,
            estimated_time = EXCLUDED.estimated_time,
            aircraft_type_code = EXCLUDED.aircraft_type_code
          RETURNING (xmax = 0) AS inserted;
          `,
          [
            finalAirlineCode,
            flight_number,
            flight_date,
            movement_type,
            scheduled_time,
            estimated_time,
            aircraft_type_code,
            finalOrigin,
            finalDestination,
          ]
        );

        if (r.rows[0]?.inserted) inserted++;
        else updated++;
      } catch {
        failed++;
      }
    }

    await client.query("COMMIT");
    return { inserted, updated, failed };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
