const express = require("express");
const { Session } = require("../models");
const router = express.Router();

// ✅ Admin views all booked sessions
router.get("/sessions", async (req, res) => {
    try {
        const sessions = await Session.findAll();
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
 
// ✅ Admin cancels a session
router.post("/session/cancel/:sessionId", async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await Session.findByPk(sessionId);

        if (!session) return res.status(404).json({ error: "Session not found" });

        // Update session status
        session.status = "cancelled";
        await session.save();

        // Mark counselor as available again
        await Availability.update({ status: "available" }, { where: { counsellorId: session.counsellorId } });

        res.json({ message: "Session cancelled successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
