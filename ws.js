const WebSocket = require("ws");

function setupWebSocket(server) {
  const ws = new WebSocket("wss://counselease27-backend.onrender.com");
  const clients = new Map(); // Store connected clients

  wss.on("connection", (ws) => {
    console.log("🔗 New WebSocket client connected");

    // Handle incoming messages
    ws.on("message", (message) => {
      try {
        const parsedMessage = JSON.parse(message);
        console.log(`📩 Received:`, parsedMessage);

        if (parsedMessage.type === "register") {
          // Store the user connection
          if (!clients.has(parsedMessage.userId)) {
            clients.set(parsedMessage.userId, new Set());
          }
          clients.get(parsedMessage.userId).add(ws);
          console.log(`✅ User ${parsedMessage.userId} registered.`);
        } 
        
        else if (parsedMessage.type === "message") {
          const recipientSockets = clients.get(parsedMessage.recipientId);
          if (recipientSockets) {
            recipientSockets.forEach((recipientSocket) => {
              if (recipientSocket.readyState === WebSocket.OPEN) {
                recipientSocket.send(JSON.stringify(parsedMessage));
                console.log(`📤 Sent message to User ${parsedMessage.recipientId}`);
              }
            });
          } else {
            console.log(`⚠️ User ${parsedMessage.recipientId} is not connected.`);
          }
        }
      } catch (error) {
        console.error("❌ Error handling message:", error);
      }
    });

    // Handle WebSocket disconnection
    ws.on("close", () => {
      console.log("❌ WebSocket connection closed.");
      for (let [userId, sockets] of clients.entries()) {
        if (sockets.has(ws)) {
          sockets.delete(ws);
          console.log(`🔴 User ${userId} disconnected.`);
          if (sockets.size === 0) {
            clients.delete(userId);
          }
        }
      }
    });

    // Handle WebSocket errors
    ws.on("error", (error) => {
      console.error("❌ WebSocket error:", error);
    });

    // Send ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);

    // Stop pinging if client disconnects
    ws.on("close", () => clearInterval(pingInterval));
  });

  return wss;
}

module.exports = setupWebSocket;
