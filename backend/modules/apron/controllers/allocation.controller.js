import pool from "../../../config/db.js";

export const getAllocations = async (req, res) => {
  const { date, flight, bay } = req.query;

  try {
    let query = `
      SELECT 
        f.flight_number,
        f.aircraft_type_code,
        f.scheduled_time,
        b.bay_id,
        ba.allocation_state
      FROM bay_allocations ba
      JOIN flights f ON ba.flight_id = f.flight_id
      JOIN bays b ON ba.bay_id = b.bay_id
      WHERE 1=1
    `;

    const values = [];
    let index = 1;

    if (date) {
      query += ` AND DATE(f.scheduled_time) = $${index++}`;
      values.push(date);
    }

    if (flight) {
      query += ` AND f.flight_number ILIKE $${index++}`;
      values.push(`%${flight}%`);
    }

    if (bay) {
      query += ` AND b.bay_id = $${index++}`;
      values.push(bay);
    }

    query += ` ORDER BY f.scheduled_time ASC`;

    const result = await pool.query(query, values);
    res.json(result.rows);

  } catch (err) {
    console.error("Allocation fetch error:", err);
    res.status(500).json({ error: err.message });
  }
};