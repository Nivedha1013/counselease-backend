require("dotenv").config(); // Load environment variables

const http = require("http");
const express = require("express");
const { Server } = require("ws");
const cors = require("cors");
const db = require("./models");
const sequelize = db.sequelize;
const authRoutes = require("./routes/authRoutes");
const session= require("./routes/session");
const availability = require("./routes/availability");
const admin = require("./routes/admin");
const subscription= require("./routes/subscription");
const chat = require("./routes/chat");
const test = require("./routes/test");
const authMiddleware = require("./middleware/authMiddleware");

// Initialize Express
const app = express();


// Middleware
app.use(express.json()); 
app.use(cors({
  origin: "https://counselease27.netlify.app",
  credentials: true,
})); 
// Define Routes
app.use("/api/auth", authRoutes);
app.use("/api/session", session);
app.use("/api/availability", availability);
app.use("/api/admin", admin);
app.use("/api/subscription", subscription);
app.use("/api/chat", chat);
app.use("/api", test);

// Force HTTPS Redirect (Exclude WebSocket requests)
app.use((req, res, next) => {
  if (
    req.headers["x-forwarded-proto"] !== "https" &&
    !req.originalUrl.startsWith("/ws") // Exclude WebSocket requests
  ) {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// Test Route
app.get("/", (req, res) => res.send("Welcome to CounseLease API with SSL/TLS!"));
app.get("/api/test", (req, res) => res.json({ message: "API is working!" }));
app.get("/api/protected", authMiddleware, (req, res) => res.json({ message: "Access granted!", user: req.user }));

// Start Server
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

server.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to PostgreSQL!");

    // Sync Database AFTER successful connection
    await sequelize.sync({ alter: true });
    console.log("Database tables updated!");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }

  console.log(`
    Server running on https://counselease27-backend.onrender.com`);
});

// WebSocket Server for Real-Time Chat
const wss = new Server({ server });
const clients = new Map();

wss.on("connection", (ws) => {
  console.log("🔗 New client connected");

  ws.on("message", (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      console.log(`📩 Received:`, parsedMessage);

      if (parsedMessage.type === "register") {
        clients.set(parsedMessage.userId, ws);
        console.log(`✅ User ${parsedMessage.userId} registered.`);
      } else if (parsedMessage.type === "message") {
        const recipientSocket = clients.get(parsedMessage.recipientId);
        if (recipientSocket && recipientSocket.readyState === ws.OPEN) {
          recipientSocket.send(JSON.stringify(parsedMessage));
          console.log(`📤 Sent message to User ${parsedMessage.recipientId}`);
        }
      }
    } catch (error) {
      console.error("❌ WebSocket Error:", error);
    }
  });

  ws.on("close", () => {
    for (let [userId, client] of clients.entries()) {
      if (client === ws) {
        clients.delete(userId);
        console.log(`🔴 User ${userId} disconnected.`);
      }
    }
  });
});
