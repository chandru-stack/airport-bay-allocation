import express from "express";
import * as controller from "./events.controller.js";

const router = express.Router();

router.get("/", controller.getEvents);

export default router;