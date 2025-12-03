const SERVICE_FILE_NAME = 'services/whatsapp_client_service.js';
const FUNCTION_NAME = 'create_whatsapp_client';
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { log_action } = require('../debug/logger');

function create_whatsapp_client() {
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

  return { client, get_client_ready: () => client_ready };
}

module.exports = { create_whatsapp_client };