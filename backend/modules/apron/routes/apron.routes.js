import express from "express";
import { handleLifecycleEvent } from "../controllers/apron.controller.js";
import { getAllocations } from "../controllers/allocation.controller.js";

const router = express.Router();

router.post("/lifecycle", handleLifecycleEvent);
router.get("/allocations", getAllocations);

export default router;