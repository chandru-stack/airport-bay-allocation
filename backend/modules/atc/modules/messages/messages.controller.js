import pool from "../../../../config/db.js";
import { broadcastEvent } from "../../../../config/websocket.js";

/* =========================================
   GET MESSAGES BY ROLE
========================================= */
export const getMessages = async (req, res) => {
  const { role_id } = req.query;

  if (!role_id) {
    return res.status(400).json({ message: "role_id required" });
  }

  try {
    const result = await pool.query(
      `
      SELECT m.*, u.username AS sender_name
      FROM messages m
      JOIN users u ON m.sender_user_id = u.user_id
      WHERE m.receiver_role_id = $1
      ORDER BY m.created_at DESC
      `,
      [role_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Message fetch error:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

/* =========================================
   SEND MESSAGE
========================================= */
export const sendMessage = async (req, res) => {
  const { sender_user_id, receiver_role_id, message_type, message_text } =
    req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO messages 
      (sender_user_id, receiver_role_id, message_type, message_text)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [sender_user_id, receiver_role_id, message_type, message_text]
    );

    broadcastEvent({
      type: "NEW_MESSAGE",
      data: result.rows[0],
    });

    res.json({ message: "Message sent" });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Message sending failed" });
  }
};

/* =========================================
   MARK AS READ
========================================= */
export const markAsRead = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      `UPDATE messages SET is_read = true WHERE message_id = $1`,
      [id]
    );

    broadcastEvent({
      type: "MESSAGE_READ",
      data: { message_id: id },
    });

    res.json({ message: "Marked as read" });
  } catch (error) {
    console.error("Read update error:", error);
    res.status(500).json({ message: "Failed to update read status" });
  }
};