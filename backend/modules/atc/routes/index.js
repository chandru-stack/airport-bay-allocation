import express from "express";

import flightsRoutes from "../modules/flights/flights.routes.js";
import arrivalsRoutes from "../modules/arrivals/arrivals.routes.js";
import departuresRoutes from "../modules/departures/departures.routes.js";
import baysRoutes from "../modules/bays/bays.routes.js";
import eventsRoutes from "../modules/events/events.routes.js";
import emergencyRoutes from "../modules/emergency/emergency.routes.js";
import alertsRoutes from "../modules/alerts/alerts.routes.js";
import messagesRoutes from "../modules/messages/messages.routes.js";
import coordinationRoutes from "../modules/coordination/coordination.routes.js";

const router = express.Router();

router.use("/flights", flightsRoutes);
router.use("/arrivals", arrivalsRoutes);
router.use("/departures", departuresRoutes);
router.use("/bays", baysRoutes);
router.use("/events", eventsRoutes);
router.use("/emergency", emergencyRoutes);
router.use("/alerts", alertsRoutes);
router.use("/messages", messagesRoutes);
router.use("/coordination", coordinationRoutes);

export default router;