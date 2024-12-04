require('dotenv').config(); // To load environment variables
const express = require('express');
const { Client, RemoteAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const mongoose = require('mongoose');
const { MongoStore } = require('wwebjs-mongo');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected successfully!");
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// WhatsApp client setup
let client;
mongoose.connection.once("open", () => {
  const store = new MongoStore({ mongoose });
  client = new Client({
    authStrategy: new RemoteAuth({
      store: store,
      backupSyncIntervalMs: 300000,
    }),
  });

  client.on('qr', (qr) => {
    console.log("Scan the QR code:");
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    console.log("Client is ready!");
  });

  client.on('message', message => {
    console.log("Received message:", message.body);
    
    if (message.body === '!hello') {
      message.reply('Hello!');
    }
  });

  client.on('disconnected', (reason) => {
    console.error('Client disconnected:', reason);
  });

  client.initialize();
});

// Express routes
app.get('/', (req, res) => {
  res.send('WhatsApp Bot is live!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
