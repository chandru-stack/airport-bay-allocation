import express from "express";
import {
  updateBayStatus,
  getBayFlightDetails,
  getAllBays
} from "../controllers/bays.controller.js";
import { toggleBlockBay } from "../controllers/bays.controller.js";
const router = express.Router();



// ✅ Get all bays
router.get("/", getAllBays);

// ✅ Update bay status
router.post("/:bayId/status", updateBayStatus);

// ✅ Get flight details for bay
router.get("/:bayId/flight", getBayFlightDetails);
router.post("/:bayId/block", toggleBlockBay);

export default router;