const WebSocket = require("ws");

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  const clients = new Map(); // To store connected clients

  wss.on("connection", (ws) => {
    console.log("🔗 New WebSocket client connected");

    ws.on("message", (message) => {
      try {
        const parsedMessage = JSON.parse(message);
        console.log(`📩 Received:`, parsedMessage);

        if (parsedMessage.type === "register") {
          clients.set(parsedMessage.userId, ws);
          console.log(`✅ User ${parsedMessage.userId} registered.`);
        } else if (parsedMessage.type === "message") {
          const recipientSocket = clients.get(parsedMessage.recipientId);
          if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
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
      for (let [userId, client] of clients.entries()) {
        if (client === ws) {
          clients.delete(userId);
          console.log(`🔴 User ${userId} disconnected.`);
        }
      }
    });
  });
  return wss;
}

module.exports = setupWebSocket;
