const SERVICE_FILE_NAME = 'services/whatsapp_client_service.js';
const FUNCTION_NAME = 'create_whatsapp_client';
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { log_action } = require('../debug/logger');

// --- Health watchdog tuning -------------------------------------------------
// Why this exists: on 2026-05-18 WhatsApp Web entered a "Connecting / Retrying…"
// loop (WAState=TIMEOUT) and the bot sat dead for 33h. whatsapp-web.js does NOT
// emit `disconnected` for TIMEOUT (Client.js:823 treats it as an accepted state),
// so the only reliable signal is to actively poll client.getState() and exit if
// we're not CONNECTED for too long. systemd Restart=on-failure respawns us.
const HEALTH_CHECK_INTERVAL_MS = 60_000;   // run one check every minute
const GET_STATE_TIMEOUT_MS     = 15_000;   // give up on a single check after 15s
const MAX_CONSECUTIVE_FAILURES = 5;        // ~5 min of grace before we restart

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

  // Wraps client.getState() with a hard timeout so the watchdog can't itself
  // wedge if puppeteer's CDP connection is unresponsive.
  async function read_connection_state() {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('getState timed out')), GET_STATE_TIMEOUT_MS)
    );
    try {
      return await Promise.race([client.getState(), timeout]);
    } catch (err) {
      return `ERROR:${err.message}`;
    }
  }

  // Periodic health check. Counts consecutive non-CONNECTED reads and exits
  // (so systemd respawns us) once we cross MAX_CONSECUTIVE_FAILURES.
  let consecutive_failures = 0;
  setInterval(async () => {
    // Don't penalise startup — wait until the client has fully come up.
    if (!client_ready) return;

    const state = await read_connection_state();

    if (state === 'CONNECTED') {
      consecutive_failures = 0;
      return;
    }

    consecutive_failures += 1;
    log_action(
      'CLIENT_UNHEALTHY',
      `state=${state} (${consecutive_failures}/${MAX_CONSECUTIVE_FAILURES})`
    );

    if (consecutive_failures >= MAX_CONSECUTIVE_FAILURES) {
      log_action('CLIENT_UNHEALTHY_EXIT', `state=${state}`);
      process.exit(1); // systemd Restart=on-failure brings us back fresh
    }
  }, HEALTH_CHECK_INTERVAL_MS);

  return { client, get_client_ready: () => client_ready };
}

module.exports = { create_whatsapp_client };