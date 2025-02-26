const express = require("express");
const { Subscription } = require("../models");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// 📌 Create a Subscription (Renamed from /subscribe to /create)
router.post("/create", authMiddleware, async (req, res) => {
    try {
        const { plan, price,startDate, endDate } = req.body;
        const userId = req.user.id;

        if (!plan || !price || !startDate || !endDate) {
            return res.status(400).json({ error: "Plan, price, start and end dates are required." });
        }

        const subscription = await Subscription.create({
            userId,
            plan,
            price,
            startDate,
            endDate,    
            status: "active"
        });

        res.status(201).json({ message: "Subscription created successfully!", subscription });
    } catch (error) {
        console.error("❌ Error creating subscription:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// 📌 Get Active Subscription for Logged-in User (Modified from GET /)
router.get("/", authMiddleware, async (req, res) => {
    try {
      console.log("Authenticated User:", req.user); // Debugging line
  
      // Extract userId properly
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ error: "User ID is missing from request" });
      }
  
      const subscription = await Subscription.findOne({
        where: { userId: userId, status: "Active" },
      });
  
      if (!subscription) return res.status(404).json({ message: "No active subscription" });
  
      res.json(subscription);
    } catch (error) {
      console.error("❌ Error fetching subscription:", error);
      res.status(500).json({ error: "Server error", details: error.message });
    }
  });
  

// 📌 Cancel Subscription (New Feature)
router.put("/cancel/:subscriptionId", authMiddleware, async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const subscription = await Subscription.findByPk(subscriptionId);

        if (!subscription) {
            return res.status(404).json({ error: "Subscription not found" });
        }

        subscription.status = "canceled";
        await subscription.save();

        res.status(200).json({
            message: "Subscription canceled successfully!",
            subscription
        });
    } catch (error) {
        console.error("❌ Error canceling subscription:", error);
        res.status(500).json({ error: "Server error" });
    }
});


module.exports = router;
