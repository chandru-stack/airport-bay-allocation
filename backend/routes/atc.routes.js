import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import atcRoutes from "../modules/atc/routes/index.js";

const router = express.Router();

/**
 * 1️⃣ Require authentication
 */
router.use(requireAuth);

/**
 * 2️⃣ Restrict to ATC Controller role
 *    Must match role stored in DB and JWT
 */
router.use(requireRole("ATC_CONTROLLER"));

/**
 * 3️⃣ Mount ATC domain routes
 *    /api/atc/*
 */
router.use("/", atcRoutes);

export default router;