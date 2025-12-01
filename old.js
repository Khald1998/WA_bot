// index.js
const express = require('express');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
app.use(express.json()); // to parse JSON bodies

// Initialize the WhatsApp client with local authentication
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // Prevents shared memory issues
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // Useful for low-resource environments
      '--disable-gpu'
    ],
    headless: true // Ensure headless mode is explicit
  }
});

// Track whether the client is ready
let isClientReady = false;

// 1) Show QR code in terminal so you can scan it with WhatsApp
client.on('qr', (qr) => {
  console.log('🔍 Please scan this QR code with your WhatsApp app:\n');
  qrcode.generate(qr, { small: true });
});

// 2) Once the client is ready, we can start accepting HTTP requests
client.on('ready', () => {
  console.log('✅ WhatsApp client is ready!');
  isClientReady = true;
});

// 3) Handle authentication failures (optional, but recommended)
client.on('auth_failure', (msg) => {
  console.error('⚠️ Auth failure:', msg);
});

// 4) Initialize the WhatsApp client
client.initialize();

// 5) Define the POST /send endpoint
app.post('/send', async (req, res) => {
  if (!isClientReady) {
    return res.status(503).json({
      error: 'WhatsApp client not ready yet. Please wait a moment and try again.'
    });
  }

  const { number, message } = req.body;
  if (!number || !message) {
    return res.status(400).json({
      error: 'Request body must contain both "number" and "message" fields.'
    });
  }

  // Normalize the number: remove '+' and any non‐digit characters
  const normalized = number.replace(/\D/g, '');
  // Construct the chat ID (e.g. "966598685983@c.us")
  const chatId = `${normalized}@c.us`;

  try {
    await client.sendMessage(chatId, message);
    return res.json({ success: true, to: chatId, message });
  } catch (err) {
    console.error('❌ Failed to send message:', err);
    return res.status(500).json({
      error: 'Failed to send message. See server logs for details.',
      details: err.message
    });
  }
});

// 6) Start the Express server on port 3000 (or any port you prefer)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 HTTP API listening on http://localhost:${PORT}`);
  console.log(`   → POST /send   { "number": "<recipient>", "message": "<text>" }`);
});
