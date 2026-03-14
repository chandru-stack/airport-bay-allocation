import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import flightsRoutes from "../modules/airline/flights.routes.js";

const router = express.Router();

// Protect all airline endpoints
router.use(requireAuth);
router.use(requireRole("AIRLINE"));

// Mount airline module routes
router.use("/", flightsRoutes);

export default router;