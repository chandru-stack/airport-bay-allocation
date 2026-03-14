// src/routes/flights.routes.js
import express from "express";
import multer from "multer";
import Papa from "papaparse";

import { requireAuth } from "../middleware/auth.middleware.js";

import {
  createFlight,
  listFlights,
  updateFlight,
  deleteFlight,
  upsertFlightsFromCsvRows,
} from "../services/flightService.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Protect all endpoints
router.use(requireAuth);

/**
 * GET /api/flights?from=DEL&to=IXM&movement_type=A
 * NOTE: In this project, "from" and "to" are IATA codes (Origin/Destination), not date filters.
 */
router.get("/", async (req, res, next) => {
  try {
    const filters = {
      from: req.query.from ? String(req.query.from).toUpperCase() : "",
      to: req.query.to ? String(req.query.to).toUpperCase() : "",
      movement_type: req.query.movement_type
        ? String(req.query.movement_type).toUpperCase()
        : "ALL",
    };

    const rows = await listFlights(req.user, filters);
    res.json({ ok: true, flights: rows });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/flights
 */
router.post("/", async (req, res, next) => {
  try {
    const created = await createFlight(req.user, req.body);
    res.status(201).json({ ok: true, flight: created });
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /api/flights/:id
 */
router.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, error: "Invalid flight id" });
    }
    const updated = await updateFlight(req.user, id, req.body);
    res.json({ ok: true, flight: updated });
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/flights/:id
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, error: "Invalid flight id" });
    }
    await deleteFlight(req.user, id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/flights/bulk-upload
 * multipart/form-data with field name "file"
 */
router.post(
  "/bulk-upload",
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ ok: false, error: "No file uploaded" });
      }

      const csvText = req.file.buffer.toString("utf-8");
      const parsed = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
      });

      if (parsed.errors?.length) {
        return res
          .status(400)
          .json({ ok: false, error: parsed.errors[0].message });
      }

      const summary = await upsertFlightsFromCsvRows(req.user, parsed.data);
      res.json({ ok: true, ...summary });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
