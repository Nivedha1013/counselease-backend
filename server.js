const express = require("express");
const { sequelize } = require("./models"); // Import database connection
const authRoutes = require("./routes/auth"); // Import auth routes
const authMiddleware = require("./middleware/authMiddleware"); // Import auth middleware
const sessionRoutes = require("./routes/session");
const subscriptionRoutes = require("./routes/subscription");
const chatRoutes=require('./routes/chat');
const http = require("http");
const cors = require("cors");
const { Server } = require('ws');
const setupWebsocket = require("./ws");
const testRoutes = require("./routes/test");
const app = express();



app.use(express.json()); // Middleware to parse JSON
app.use("/api/auth", authRoutes); // Use authentication routes
app.use("/api/session", sessionRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use('/api/chat',chatRoutes);
app.use("/api", testRoutes);
app.use(cors());

// Test Route
app.get("/", (req, res) => {
  res.send("Welcome to CounseLease API!");
});

// 🔐 Protected Route (Only accessible with a valid token)
app.get("/api/protected", authMiddleware, (req, res) => {
    res.json({ message: "Access granted!", user: req.user });
  });
  app.get("/api/test", (req, res) => {
    res.json({ message: "API is working!" });
});



// Start Server
const PORT = process.env.PORT || 5000;
const server=http.createServer(app);
// Initialize WebSocket server
setupWebsocket(server);
const wss=new Server({server});
const clients= new Map();

server.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to PostgreSQL!");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
  }
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
wss.on("connection", (ws) => {
    console.log("🔗 New client connected");
    //when a message is received 
    ws.on("message", (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          console.log(`📩 Received:`, parsedMessage);
    
          if (parsedMessage.type === "register") {
            // Register a user connection
            clients.set(parsedMessage.userId, ws);
            console.log(`✅ User ${parsedMessage.userId} registered.`);
          } else if (parsedMessage.type === "message") {
            // Broadcast message to recipient
            const recipientSocket = clients.get(parsedMessage.recipientId);
            if (recipientSocket && recipientSocket.readyState === ws.OPEN) {
              recipientSocket.send(JSON.stringify(parsedMessage));
              console.log(`📤 Sent message to User ${parsedMessage.recipientId}`);
            }
          }
        } catch (error) {
          console.error("❌ Error handling message:", error);
        }
      });
    
      ws.on("close", () => {
        console.log("❌ WebSocket connection closed.");
        // Remove disconnected users from the clients map
        for (let [userId, client] of clients.entries()) {
          if (client === ws) {
            clients.delete(userId);
            console.log(`🔴 User ${userId} disconnected.`);
          }
        }
      });
    });


