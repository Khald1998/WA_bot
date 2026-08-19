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
// Silent Store-detach guard: on 2026-08-13 the client stayed WAState=CONNECTED for
// ~56h while the WA Web Store had silently detached, so `message_create` never fired
// and getState() alone couldn't see it. If we're CONNECTED but have not received a
// single message (across ALL chats — the account is in many active ones) for this
// long, treat it as a silent detach and exit so systemd respawns a fresh session.
// Threshold is set well above the observed natural overnight-quiet gap (~6-8h of no
// traffic, 02:00-08:00 KSA) so a genuinely quiet night doesn't trigger a needless
// restart (each restart re-inits the session and can drop inbound during ~30-60s).
const MESSAGE_STALL_MS = 12 * 60 * 60_000; // 12h of total silence while CONNECTED

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
  // Heartbeat for the silent Store-detach guard: bumped on every inbound/outbound
  // message. Seeded at ready so a freshly-connected-but-quiet client isn't flagged.
  let last_message_at = Date.now();
  client.on('message_create', () => { last_message_at = Date.now(); });

  client.on('qr', (qr) => {
    log_action('QR_RECEIVED', 'QR code generated for WhatsApp login');
    console.log('🔍 Please scan this QR code with your WhatsApp app:\n');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', async () => {
    log_action('CLIENT_READY', 'WhatsApp client is ready');
    console.log('✅ WhatsApp client is ready!');
    client_ready = true;
    last_message_at = Date.now();

    // WhatsApp Web renamed MsgKey._serialized to `$1` (~July 2026). whatsapp-web.js
    // 1.34.7 still reads `message.id._serialized` (e.g. inside downloadMedia, which
    // passes it to Msg.get in the page) — now undefined, so EVERY image download
    // fails with "r". Wrap WWebJS.getMessageModel so every serialized message id
    // carries `_serialized` mirrored from `$1`. One runtime patch fixes downloadMedia
    // and all other _serialized consumers uniformly, and lives in our code (survives
    // whatsapp-web.js reinstalls). Verified on the live store before shipping.
    try {
      await client.pupPage.evaluate(() => {
        if (window.WWebJS && !window.WWebJS.__serializedShim) {
          const orig = window.WWebJS.getMessageModel;
          window.WWebJS.getMessageModel = (message) => {
            const msg = orig(message);
            if (msg && msg.id && msg.id._serialized === undefined && msg.id['$1'] !== undefined) {
              msg.id = Object.assign({}, msg.id, { _serialized: msg.id['$1'] });
            }
            return msg;
          };
          window.WWebJS.__serializedShim = true;
        }
      });
      log_action('MSGKEY_SHIM', 'getMessageModel _serialized shim installed');
    } catch (err) {
      log_action('MSGKEY_SHIM_ERROR', err.message);
    }
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
      // Silent Store-detach guard: CONNECTED but no messages for too long.
      const stall_ms = Date.now() - last_message_at;
      if (stall_ms > MESSAGE_STALL_MS) {
        log_action('CLIENT_MESSAGE_STALL_EXIT',
          `CONNECTED but no message for ${Math.round(stall_ms / 60_000)}min`);
        process.exit(1); // systemd Restart=on-failure brings us back fresh
      }
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