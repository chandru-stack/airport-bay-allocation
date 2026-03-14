import express from "express";
import {
  getArrivingFlights,
  getDepartingFlights
} from "../controllers/flights.controller.js";

const router = express.Router();

router.get("/arrivals", getArrivingFlights);
router.get("/departures", getDepartingFlights);

export default router;
