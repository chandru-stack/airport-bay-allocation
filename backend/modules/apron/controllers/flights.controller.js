import pool from "../../../config/db.js";

/* ===============================
   GET ARRIVING FLIGHTS
================================= */
export const getArrivingFlights = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        flight_number,
        aircraft_type_code,
        scheduled_time,
        operational_status
      FROM flights
      WHERE movement_type = 'A'
      ORDER BY scheduled_time ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching arriving flights:", err);
    res.status(500).json({ error: "Failed to fetch arriving flights" });
  }
};


/* ===============================
   GET DEPARTING FLIGHTS
================================= */
export const getDepartingFlights = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        flight_number,
        aircraft_type_code,
        scheduled_time,
        operational_status
      FROM flights
      WHERE movement_type = 'D'
      ORDER BY scheduled_time ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching departing flights:", err);
    res.status(500).json({ error: "Failed to fetch departing flights" });
  }
};
