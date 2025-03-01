require("dotenv").config(); // To load environment variables
const express = require("express");
const { Client, RemoteAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const mongoose = require("mongoose");
const { MongoStore } = require("wwebjs-mongo");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode"); // Import the QRCode library
const runAgent = require("./Botreply");

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
let globalQRCodeDataURL = null; // Store the QR code as a Base64 data URL
// Store QR code globally for dynamic serving

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

  client.on("qr", async (qr) => {
    console.log("QR code received. Use the /qr-live endpoint to scan.");
    qrcode.generate(qr, { small: true }); // Displays QR code in terminal
    globalQRCodeDataURL = await QRCode.toDataURL(qr);
    console.log(qr);
  });

  client.on("ready", () => {
    console.log("WhatsApp client is ready!");
  });

  client.on("authenticated", () => {
    console.log("WhatsApp client authenticated successfully!");
    globalQRCodeDataURL = null; // Clear the Base64 data URL after authentication
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

  client.on("message", async (message) => {
    try {
      // Get the sender's contact
      const contact = await message.getContact();
      console.log(
        "Message received with body:",
        message.body || "No message body"
      );

      // Determine the sender's name
      const senderName =
        contact.pushname || contact.name || contact.number || "Unknown";
      console.log("Sender name:", senderName);
      console.log("Sender Phone Num:", message.from);

      // Fetch previous messages from this chat
      const chat = await message.getChat();
      const messages = (await chat.fetchMessages({ limit: 10 })) || [];

      // Ensure messages array is not empty before mapping
      const chatHistory = messages.length
        ? messages
            .map((msg) => {
              let sender = msg.from === "2347081643714@c.us" ? "Chuks" : "User";
              return `${sender}: ${msg.body}`;
            })
            .join("\n\n")
        : "No previous messages";

      console.log("Previous Messages:", chatHistory);

      // Process new message
      if (message.body?.trim()) {
        const resp = await runAgent(chatHistory, message.body.trim());
        if (resp) {
          await message.reply(resp);
          console.log("Replied with:", resp);
        }
      } else {
        console.log("No valid message received.");
      }

      // Handle chat history request
      if (message.body?.trim() === "!history") {
        let history = messages.length
          ? messages.map((msg, i) => `${i + 1}. ${msg.body}`).join("\n")
          : "No chat history available.";

        await message.reply(`Chat history:\n${history}`);
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  client.on("message", async (msg) => {
    if (msg.body === "!send-media") {
      /// send file to server
      // const media = await MessageMedia.fromUrl('https://via.placeholder.com/350x150.png');
      ////sending local media
      // const media = MessageMedia.fromFilePath('./path/to/image.png');
      const media = new MessageMedia("image/png", base64Image);
      await client.sendMessage(msg.from, media);
      /// you can add caption
      // await client.sendMessage(chatId, media, { caption: 'this is my caption' });
    }
  });

  client.on("message", async (msg) => {
    if (msg.hasMedia) {
      const media = await msg.downloadMedia();
      // do something with the media data here
    }
  });
  //   client.on('message_create', message => {
  // 	if (message.body === '!ping') {
  // 		// send back "pong" to the chat the message was sent in
  // 		client.sendMessage(message.from, 'pong');
  // 	}
  // });
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
  if (globalQRCodeDataURL) {
    res.type("text/html");
    res.send(`
        <img src="${globalQRCodeDataURL}" alt="Scan this QR code with WhatsApp" />
        <p>Scan this QR code with WhatsApp!</p>
      `);
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
