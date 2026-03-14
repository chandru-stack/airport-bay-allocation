import express from "express";
import * as controller from "./bays.controller.js";

const router = express.Router();

router.get("/", controller.getBayVisibility);
router.patch("/status", controller.updateBayStatus);

export default router;