const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User, Subscription } = require("../models"); // Import models
const authMiddleware = require("../middleware/authMiddleware");
require("dotenv").config();

const router = express.Router();

// 🔹 SIGNUP Route (With Role Support)
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate role
    if (!["admin", "counsellor", "client"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Allowed roles: admin, counsellor, client" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Enforce password security (Optional)
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with role
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role, // ✅ Ensure role is saved
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role, // ✅ Return correct role
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Signup Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 🔹 LOGIN Route (With Role in JWT)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT token (with role included)
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role, // ✅ Return role in response
      },
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 🔹 View User Profile (Protected)
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "name", "email", "role"],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("❌ Profile Fetch Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// 🔹 Edit User Profile (Protected)
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if email already exists (if changed)
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use." });
      }
      user.email = email;
    }

    user.name = name || user.name;
    await user.save();

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("❌ Profile Update Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// 🔹 Fetch Active Subscription (Move to `subscription.routes.js` if necessary)
router.get("/subscription", authMiddleware, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { userId: req.user.id, status: "Active" },
    });

    if (!subscription) return res.status(404).json({ message: "No active subscription" });

    res.json(subscription);
  } catch (error) {
    console.error("❌ Subscription Fetch Error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

module.exports = router;
