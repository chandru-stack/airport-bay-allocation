import express from "express";
import * as controller from "./messages.controller.js";

const router = express.Router();

// Get messages by role
router.get("/", controller.getMessages);

// Send message
router.post("/", controller.sendMessage);

// Acknowledge (mark as read)
router.patch("/:id/read", controller.markAsRead);

export default router;