const express = require('express');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const send_api = require('../APIs/send_api');
const test_api = require('../APIs/test_api');
const { log_action } = require('../debug/logger');

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

let client_ready = false;


client.on('qr', (qr) => {
  log_action('QR_RECEIVED', 'QR code generated for WhatsApp login');
  console.log('🔍 Please scan this QR code with your WhatsApp app:\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  log_action('CLIENT_READY', 'WhatsApp client is ready');
  console.log('✅ WhatsApp client is ready!');
  client_ready = true;
});

client.on('auth_failure', (msg) => {
  log_action('AUTH_FAILURE', msg);
  console.error('⚠️ Auth failure:', msg);
});

client.initialize();


// Mount the API router (paths are defined inside the API module)
log_action('SERVER_START', 'Mounting API router');
app.use(send_api(client, () => client_ready));
app.use(test_api);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  log_action('SERVER_LISTEN', `HTTP API listening on http://localhost:${port}`);
  console.log(`🚀 HTTP API listening on http://localhost:${port}`);
  console.log('   → POST /send   { "number": "<recipient>", "message": "<text>" }');
});
