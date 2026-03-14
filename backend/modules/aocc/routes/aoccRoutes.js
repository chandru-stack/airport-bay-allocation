import express from "express";
import * as controller from "../controllers/aoccController.js";

const router = express.Router();

/* ===== Dashboard ===== */
router.get("/summary", controller.getSummary);
router.get("/dashboard-summary", controller.getDashboardSummary);
router.get("/flights", controller.getFlights);
router.get("/bays", controller.getBays);

/* ===== Bay Allocation ===== */
router.post("/allocate-bay", controller.allocateBay);
router.post("/confirm-allocation", controller.confirmAllocation);
router.post("/reassign-bay", controller.reassignBay);

/* ===== Bay Block / Lifecycle ===== */
router.post("/bays/:bayId/block", controller.blockBay);
router.post("/bays/:bayId/unblock", controller.unblockBay);
router.post("/bays/:bayId/on-block", controller.confirmOnBlock);
router.post("/bays/:bayId/pushback", controller.confirmPushbackReady);
router.post("/bays/:bayId/off-block", controller.confirmOffBlock);

/* ===== Events ===== */
router.get("/events", controller.getEvents);

/* ===== Audit Log ===== */
router.get("/audit-log", controller.getAuditLog);

/* ===== ATC Communication ===== */
router.get("/atc-messages", controller.getATCMessages);
router.post("/atc/send", controller.sendATCMessage);
router.post("/acknowledge-atc", controller.acknowledgeATCMessage);

export default router;