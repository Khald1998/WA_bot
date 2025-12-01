const express = require('express');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const send_api = require('../APIs/send_api');
const test_api = require('../APIs/test_api');
const { logAction } = require('../debug/logger');

const app = express();
app.use(express.json());

// Initialize the WhatsApp client with local authentication
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ],
    headless: true
  }
});

let clientReady = false;

client.on('qr', (qr) => {
  logAction('QR_RECEIVED', 'QR code generated for WhatsApp login');
  console.log('🔍 Please scan this QR code with your WhatsApp app:\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  logAction('CLIENT_READY', 'WhatsApp client is ready');
  console.log('✅ WhatsApp client is ready!');
  clientReady = true;
});

client.on('auth_failure', (msg) => {
  logAction('AUTH_FAILURE', msg);
  console.error('⚠️ Auth failure:', msg);
});

client.initialize();

// Mount the API router (paths are defined inside the API module)
logAction('SERVER_START', 'Mounting API router');
app.use(send_api(client, () => clientReady));
app.use(test_api);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logAction('SERVER_LISTEN', `HTTP API listening on http://localhost:${PORT}`);
  console.log(`🚀 HTTP API listening on http://localhost:${PORT}`);
  console.log('   → POST /send   { "number": "<recipient>", "message": "<text>" }');
});
