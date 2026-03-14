import { z } from "zod";

export const createFlightRequestSchema = z.object({
  flight_id: z.number().int().positive(),
  priority: z.enum(["P1", "P2", "P3", "P4"]),
  bay_type: z.string().min(1).max(30),
  requested_bay: z.string().max(20).nullable().optional(),
  reason: z.string().min(2).max(500),
});

export const updateFlightRequestSchema = createFlightRequestSchema.partial().extend({
  flight_id: z.number().int().positive().optional(),
});
