const express = require("express");
const { Availability } = require("../models");
const router = express.Router();

// ✅ Counselors update their availability
router.post("/set", async (req, res) => {
    try {
        const { counsellorId, date, startTime, endTime, status } = req.body;
        const availability = await Availability.create({ counsellorId, date, startTime, endTime, status });
        res.json({ message: "Availability updated", availability });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
