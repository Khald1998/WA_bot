const express = require('express');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const send_api = require('../APIs/send_api');

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
  console.log('🔍 Please scan this QR code with your WhatsApp app:\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ WhatsApp client is ready!');
  clientReady = true;
});

client.on('auth_failure', (msg) => {
  console.error('⚠️ Auth failure:', msg);
});

client.initialize();

// Mount the /send API
app.use('/', send_api(client, () => clientReady));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 HTTP API listening on http://localhost:${PORT}`);
  console.log('   → POST /send   { "number": "<recipient>", "message": "<text>" }');
});
