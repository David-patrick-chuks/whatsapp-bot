require("dotenv").config(); // To load environment variables
const express = require("express");
const { Client, RemoteAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const mongoose = require("mongoose");
const { MongoStore } = require("wwebjs-mongo");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// Function to clear .wwebjs files and folders
const clearWWebjsCache = () => {
  const cacheDir = path.join(__dirname, "..wwebjs_auth");
  const wwebjsDir = path.join(__dirname, ".wwebjs_cache");

  // Delete cache/wwebjs folder
  if (fs.existsSync(cacheDir)) {
    fs.rmSync(cacheDir, { recursive: true, force: true });
    console.log("Cleared cache/wwebjs folder.");
  }

  // Delete .wwebjs folder
  if (fs.existsSync(wwebjsDir)) {
    fs.rmSync(wwebjsDir, { recursive: true, force: true });
    console.log("Cleared .wwebjs folder.");
  }
};

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {})
  .then(() => {
    console.log("MongoDB connected successfully!");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// WhatsApp client setup
let client;
let globalQRCode = null; // Store QR code globally for dynamic serving

mongoose.connection.once("open", () => {
  console.log("MongoDB connection is open. Initializing WhatsApp client...");
  clearWWebjsCache(); // Call this function before initializing the client

  const store = new MongoStore({ mongoose });
  console.log("MongoStore initialized.");

  client = new Client({
    authStrategy: new RemoteAuth({
      store: store,
      backupSyncIntervalMs: 300000,
    }),
  });

  client.on("qr", (qr) => {
    console.log("QR code received. Use the /qr-live endpoint to scan.");
    qrcode.generate(qr, { small: true }); // Displays QR code in terminal
    globalQRCode = qr; // Save QR code globally
  });

  client.on("ready", () => {
    console.log("WhatsApp client is ready!");
  });

  client.on("authenticated", () => {
    console.log("WhatsApp client authenticated successfully!");
  });

  client.on("auth_failure", (msg) => {
    console.error("Authentication failed:", msg);
  });

  client.on("loading_screen", (percent, message) => {
    console.log(`Loading screen: ${percent}% - ${message}`);
  });

  client.on("disconnected", (reason) => {
    console.error("WhatsApp client disconnected:", reason);
  });

  client.on("message", (message) => {
    console.log("Message received with body:", message.body);
    console.log("From:", message.from, "To:", message.to);
    if (message.body === "!hello") {
      message.reply("Hello!");
      console.log("Replied with 'Hello!'");
    }
  });

  console.log("Initializing WhatsApp client...");
  client.initialize();
});

// Express routes
app.get("/", (req, res) => {
  res.send("WhatsApp Bot is live!");
});

// Route to serve the QR code dynamically
app.get("/qr-live", (req, res) => {
  console.log("QR code request received.");
  if (globalQRCode) {
    res.type("text/html");
    qrcode.toString(globalQRCode, { type: "svg" }, (err, qrSvg) => {
      if (err) {
        res.status(500).send("Failed to generate QR code.");
      } else {
        res.send(`<div>${qrSvg}</div><p>Scan this QR code with WhatsApp!</p>`);
      }
    });
  } else {
    res.send("No QR code available yet. Please wait or restart the bot.");
  }
});

// Health check route
app.get("/health", (req, res) => {
  console.log("Health check route accessed");
  res.send("WhatsApp Bot is live and healthy!");
});

// Status route
app.get("/status", (req, res) => {
  console.log("Status route accessed");
  if (client) {
    res.send({ status: client.info ? "ready" : "not ready" });
  } else {
    res.send({ status: "client not initialized" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
