import express from "express";
import * as controller from "./coordination.controller.js";

const router = express.Router();

router.get("/", controller.getPendingRequests);
router.post("/approve", controller.approveRequest);
router.post("/reject", controller.rejectRequest);
router.post("/send", controller.createRequest); // ADD THIS

export default router;