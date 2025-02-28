const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

// User Signup
exports.signup = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if role is valid
        if (!["admin", "counsellor", "client"].includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role // Assign role correctly
        });

        res.status(201).json({
            message: "User created successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role, // Return the correct role
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error creating user", error: error.message });
    }
};

// User Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            "your_secret_key", 
            { expiresIn: "1h" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Login failed", error: error.message });
    }
};
