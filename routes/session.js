const express = require("express");
const { Session } = require("../models");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// 🔹 Book a Session (Protected)
router.post("/book", authMiddleware, async (req, res) => {
  try {
    const { counselorId, date, time } = req.body;

    const session = await Session.create({
      userId: req.user.id,
      counselorId,
      date,
      time,
      status: "Pending",
    });

    res.json({ message: "Session booked successfully", session });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// 🔹 View User’s Sessions (Protected)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const sessions = await Session.findAll({ where: { userId: req.user.id } });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
