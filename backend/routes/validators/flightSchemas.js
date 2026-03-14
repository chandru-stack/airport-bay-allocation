import { z } from "zod";

export const createFlightSchema = z.object({
  airline_code: z.string().min(1).max(10).optional(),
  flight_number: z.string().min(2).max(20),
  movement_type: z.enum(["A", "D"]),
  flight_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  scheduled_time: z.string().min(10).max(30),
  estimated_time: z.string().min(10).max(30).optional(),
  aircraft_type_code: z.string().min(2).max(10),

  // NEW: based on movement type, one side must be provided by airline
  origin_airport_code: z.string().length(3).optional(),
  destination_airport_code: z.string().length(3).optional(),
}).superRefine((val, ctx) => {
  if (val.movement_type === "A" && !val.origin_airport_code) {
    ctx.addIssue({ code: "custom", message: "origin_airport_code is required for Arrival (A)" });
  }
  if (val.movement_type === "D" && !val.destination_airport_code) {
    ctx.addIssue({ code: "custom", message: "destination_airport_code is required for Departure (D)" });
  }
});
