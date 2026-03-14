// src/routes/flightRequests.routes.js
import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";

import {
  listFlightRequests,
  createFlightRequest,
  updateFlightRequest,
} from "../services/flightRequestService.js";

const router = express.Router();

// Protect all endpoints
router.use(requireAuth);

/**
 * GET /api/flight-requests
 */
router.get("/", async (req, res, next) => {
  try {
    const rows = await listFlightRequests(req.user);
    res.json({ ok: true, requests: rows });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/flight-requests
 */
router.post("/", async (req, res, next) => {
  try {
    const created = await createFlightRequest(req.user, req.body);
    res.status(201).json({ ok: true, request: created });
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /api/flight-requests/:id
 */
router.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, error: "Invalid request id" });
    }

    const updated = await updateFlightRequest(req.user, id, req.body);
    res.json({ ok: true, request: updated });
  } catch (e) {
    next(e);
  }
});

export default router;
