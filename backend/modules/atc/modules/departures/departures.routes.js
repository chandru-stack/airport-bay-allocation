import express from "express";
import * as controller from "./departures.controller.js";

const router = express.Router();

router.get("/", controller.getDepartures);
router.post("/update-status", controller.updateDepartureStatus);

export default router;