import dotenv from "dotenv";
dotenv.config();

import { env } from "./config/env";

import http from "http";
import app from "./app";
import { websocketService } from "./modules/websocket";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize WebSocket Service
websocketService.init(server);
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "NFC ERP Backend is running",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});