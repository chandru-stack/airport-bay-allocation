import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import apronRoutes from "../modules/apron/routes/apron.routes.js";
import flightsRoutes from "../modules/apron/routes/flights.routes.js";
import baysRoutes from "../modules/apron/routes/bays.routes.js";
import eventsRoutes from "../modules/apron/routes/events.routes.js";
import allocationRoutes from "../modules/apron/routes/bayAllocation.routes.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireRole("APRON_CONTROLLER"));

router.use("/core", apronRoutes);
router.use("/flights", flightsRoutes);
router.use("/bays", baysRoutes);
router.use("/events", eventsRoutes);
router.use("/allocation", allocationRoutes);

export default router;