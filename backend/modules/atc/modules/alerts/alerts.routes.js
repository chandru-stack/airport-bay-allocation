import express from "express";
import * as controller from "./alerts.controller.js";

const router = express.Router();

/* GET ALERTS */
router.get("/", controller.getAlerts);

export default router;