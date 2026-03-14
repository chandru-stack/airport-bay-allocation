import pool from "../../../../config/db.js";

export const getEvents = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.event_id,
        e.event_time,
        e.event_type,
        e.payload,
        f.flight_number,
        u.username
      FROM events e
      LEFT JOIN flights f ON e.flight_id = f.flight_id
      LEFT JOIN users u ON e.actor_user_id = u.user_id
      ORDER BY e.event_time DESC
      LIMIT 50;
    `);

    res.json(result.rows);

  } catch (error) {
    console.error("Event Fetch Error:", error);
    res.status(500).json({ message: "Failed to fetch events" });
  }
};