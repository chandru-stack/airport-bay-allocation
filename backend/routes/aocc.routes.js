import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import aoccRoutes from "../modules/aocc/routes/aoccRoutes.js";

const router = express.Router();

/*
  1️⃣ All AOCC routes require authentication
*/
router.use(requireAuth);

/*
  2️⃣ Only AOCC_CONTROLLER role allowed
*/
router.use(requireRole("AOCC_CONTROLLER"));

/*
  3️⃣ Mount AOCC module routes
*/
router.use("/", aoccRoutes);

export default router;