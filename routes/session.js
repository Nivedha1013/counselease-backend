const express = require("express");
const { Session, Availability, User } = require("../models");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

// ✅ Clients check counselor availability
router.get("/check/:counsellorId/:date", async (req, res) => {
    try {
        const { counsellorId, date } = req.params;
        const availability = await Availability.findOne({ where: { counsellorId, date, status: "available" } });

        if (!availability) return res.json({ available: false, message: "Counselor not available" });

        res.json({ available: true, availability });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Counselors update their availability
router.post("/update-availability", authMiddleware, async (req, res) => {
    try {
        const { userId, role } = req.user; // Authenticated user
        if (role !== "counsellor") return res.status(403).json({ error: "Access denied" });

        const { date, status, startTime, endTime } = req.body;

        const availability = await Availability.create({
            counsellorId: userId, date, status, startTime, endTime
        });

        res.json({ message: "Availability updated", availability });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Clients book a session if counselor is available
router.post("/book", authMiddleware, async (req, res) => {
    try {
        const { userId, role } = req.user;
        if (role !== "client") return res.status(403).json({ error: "Only clients can book sessions" });

        const { counsellorId, date, startTime, endTime } = req.body;

        // Check if counselor is available
        const availability = await Availability.findOne({
            where: { counsellorId, date, status: "available" }
        });

        if (!availability) return res.status(400).json({ error: "Counselor not available" });

        // Book the session
        const session = await Session.create({ clientId: userId, counsellorId, date, startTime, endTime });

        // Update counselor status to "busy"
        await Availability.update({ status: "busy" }, { where: { id: availability.id } });

        res.json({ message: "Session booked successfully", session });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Admin view all booked sessions
router.get("/all-sessions", authMiddleware, async (req, res) => {
    try {
        const { role } = req.user;
        if (role !== "admin") return res.status(403).json({ error: "Access denied" });

        const sessions = await Session.findAll({ include: [{ model: User, as: "client" }, { model: User, as: "counsellor" }] });

        res.json({ sessions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Admin can cancel/reschedule a session
router.post("/admin/manage-session", authMiddleware, async (req, res) => {
    try {
        const { role } = req.user;
        if (role !== "admin") return res.status(403).json({ error: "Access denied" });

        const { sessionId, action, newDate, newTime } = req.body;

        const session = await Session.findByPk(sessionId);
        if (!session) return res.status(404).json({ error: "Session not found" });

        if (action === "cancel") {
            await session.destroy();
            await Availability.update({ status: "available" }, { where: { counsellorId: session.counsellorId, date: session.date } });
            return res.json({ message: "Session cancelled successfully" });
        } else if (action === "reschedule") {
            session.date = newDate;
            session.startTime = newTime;
            await session.save();
            return res.json({ message: "Session rescheduled successfully", session });
        }

        res.status(400).json({ error: "Invalid action" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
