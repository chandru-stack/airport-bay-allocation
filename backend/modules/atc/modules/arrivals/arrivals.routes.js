import express from "express";
import * as controller from "./arrivals.controller.js";

const router = express.Router();

router.get("/", controller.getArrivals);

export default router;