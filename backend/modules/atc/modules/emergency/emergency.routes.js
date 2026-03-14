import express from "express";
import * as controller from "./emergency.controller.js";

const router = express.Router();

/* Get active emergencies */
router.get("/", controller.getActiveEmergencies);

/* Activate emergency */
router.post("/", controller.activateEmergency);

export default router;