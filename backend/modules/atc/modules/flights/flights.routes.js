import express from "express";
import * as controller from "./flights.controller.js";

const router = express.Router();

/* =========================================
   GET ALL FLIGHTS
========================================= */
router.get("/", controller.getFlights);

/* =========================================
   GET ARRIVALS (INBOUND)
========================================= */
router.get("/arrivals", controller.getInboundFlights);

/* =========================================
   UPDATE FLIGHT STATUS
========================================= */
router.patch("/:flightId/status", controller.updateFlightStatus);

export default router;