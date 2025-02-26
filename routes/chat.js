const express = require("express");
const { ChatMessage } = require("../models");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get chat history between two users
router.get("/:recipientId", authMiddleware, async (req, res) => {
  try {
    const { recipientId } = req.params;
    const senderId = req.user.id;

    const messages = await ChatMessage.findAll({
      where: {
        [Op.or]: [
          { senderId: senderId, recipientId: recipientId },
          { senderId: recipientId, recipientId: senderId },
        ],
      },
      order: [["timestamp", "ASC"]],
    });

    res.json(messages);
  } catch (error) {
    console.error("❌ Error fetching chat history:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

module.exports = router;
