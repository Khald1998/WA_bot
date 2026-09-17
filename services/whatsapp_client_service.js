const SERVICE_FILE_NAME = 'services/whatsapp_client_service.js';  // this module's own relative path label
const FUNCTION_NAME = 'create_whatsapp_client';  // name of the factory function this file exports
const qrcode = require('qrcode-terminal');  // renders the login QR code as ASCII in the terminal
const { Client, LocalAuth } = require('whatsapp-web.js');  // WhatsApp Web client class and local session auth
const { log_action } = require('../debug/logger');  // structured logger used across the bot

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

function create_whatsapp_client() {  // factory that builds and wires up the WhatsApp client
  const client = new Client({  // construct the whatsapp-web.js client
    authStrategy: new LocalAuth(),  // persist the session to disk so we don't rescan each boot
    puppeteer: {  // Chromium launch options for the headless browser
      args: [  // command-line flags passed to Chromium
        '--no-sandbox',  // disable Chromium sandbox (needed when running as root)
        '--disable-setuid-sandbox',  // also drop the setuid sandbox helper
        '--disable-dev-shm-usage',  // use /tmp instead of tiny /dev/shm to avoid crashes
        '--disable-accelerated-2d-canvas',  // turn off GPU 2D canvas acceleration
        '--no-first-run',  // skip Chromium's first-run setup
        '--no-zygote',  // don't use the zygote process-forking model
        '--single-process',  // run Chromium in a single process
        '--disable-gpu'  // disable GPU hardware acceleration
      ],  // end args array
      headless: true  // run Chromium with no visible window
    }  // end puppeteer options
  });  // end Client construction

  let client_ready = false;  // tracks whether the client has emitted 'ready'
  // Heartbeat for the silent Store-detach guard: bumped on every inbound/outbound
  // message. Seeded at ready so a freshly-connected-but-quiet client isn't flagged.
  let last_message_at = Date.now();  // timestamp of the most recent message seen
  client.on('message_create', () => { last_message_at = Date.now(); });  // refresh heartbeat on any message

  client.on('qr', (qr) => {  // fired when WhatsApp Web wants a QR login scan
    log_action('QR_RECEIVED', 'QR code generated for WhatsApp login');  // log that a QR was issued
    console.log('🔍 Please scan this QR code with your WhatsApp app:\n');  // prompt the operator to scan
    qrcode.generate(qr, { small: true });  // draw the QR compactly in the terminal
  });  // end qr handler

  client.on('ready', async () => {  // fired once the session is authenticated and ready
    log_action('CLIENT_READY', 'WhatsApp client is ready');  // log readiness
    console.log('✅ WhatsApp client is ready!');  // print a ready banner to the console
    client_ready = true;  // mark the client ready for the watchdog and API
    last_message_at = Date.now();  // seed the heartbeat so a quiet start isn't flagged

    // WhatsApp Web renamed MsgKey._serialized to `$1` (~July 2026). whatsapp-web.js
    // 1.34.7 still reads `message.id._serialized` (e.g. inside downloadMedia, which
    // passes it to Msg.get in the page) — now undefined, so EVERY image download
    // fails with "r". Wrap WWebJS.getMessageModel so every serialized message id
    // carries `_serialized` mirrored from `$1`. One runtime patch fixes downloadMedia
    // and all other _serialized consumers uniformly, and lives in our code (survives
    // whatsapp-web.js reinstalls). Verified on the live store before shipping.
    try {  // guard the page-context patch in case evaluate throws
      await client.pupPage.evaluate(() => {  // run this function inside the WhatsApp Web page
        if (window.WWebJS && !window.WWebJS.__serializedShim) {  // only patch once, when WWebJS exists
          const orig = window.WWebJS.getMessageModel;  // keep a reference to the original getMessageModel
          window.WWebJS.getMessageModel = (message) => {  // replace it with our wrapping version
            const msg = orig(message);  // build the model via the original function
            if (msg && msg.id && msg.id._serialized === undefined && msg.id['$1'] !== undefined) {  // when _serialized is missing but $1 exists
              msg.id = Object.assign({}, msg.id, { _serialized: msg.id['$1'] });  // mirror $1 onto a new _serialized field
            }  // end missing-id fixup
            return msg;  // hand back the (possibly patched) model
          };  // end getMessageModel wrapper
          window.WWebJS.__serializedShim = true;  // flag that the shim is installed
        }  // end one-time install guard
      });  // end page evaluate
      log_action('MSGKEY_SHIM', 'getMessageModel _serialized shim installed');  // log successful shim install
    } catch (err) {  // catch any failure injecting the shim
      log_action('MSGKEY_SHIM_ERROR', err.message);  // log the shim error message
    }  // end try/catch
  });  // end ready handler

  client.on('auth_failure', (msg) => {  // fired when the saved session is rejected
    log_action('AUTH_FAILURE', msg);  // log the auth failure reason
    console.error('⚠️ Auth failure:', msg);  // print the failure to stderr
  });  // end auth_failure handler

  // Wraps client.getState() with a hard timeout so the watchdog can't itself
  // wedge if puppeteer's CDP connection is unresponsive.
  async function read_connection_state() {  // read WA state without hanging forever
    const timeout = new Promise((_, reject) =>  // a promise that rejects when time runs out
      setTimeout(() => reject(new Error('getState timed out')), GET_STATE_TIMEOUT_MS)  // reject after the timeout window
    );  // end timeout promise
    try {  // attempt the state read
      return await Promise.race([client.getState(), timeout]);  // whichever settles first: state or timeout
    } catch (err) {  // getState threw or timed out
      return `ERROR:${err.message}`;  // return the error as a string state
    }  // end try/catch
  }  // end read_connection_state

  // Periodic health check. Counts consecutive non-CONNECTED reads and exits
  // (so systemd respawns us) once we cross MAX_CONSECUTIVE_FAILURES.
  let consecutive_failures = 0;  // running count of failed health checks
  setInterval(async () => {  // run the health check on a fixed interval
    // Don't penalise startup — wait until the client has fully come up.
    if (!client_ready) return;  // skip checks until the client is ready

    const state = await read_connection_state();  // read the current WA connection state

    if (state === 'CONNECTED') {  // healthy: connection is up
      consecutive_failures = 0;  // reset the failure streak
      // Silent Store-detach guard: CONNECTED but no messages for too long.
      const stall_ms = Date.now() - last_message_at;  // how long since the last message
      if (stall_ms > MESSAGE_STALL_MS) {  // exceeded the silence threshold
        log_action('CLIENT_MESSAGE_STALL_EXIT',  // log the silent-detach exit
          `CONNECTED but no message for ${Math.round(stall_ms / 60_000)}min`);  // include minutes of silence
        process.exit(1); // systemd Restart=on-failure brings us back fresh
      }  // end stall check
      return;  // healthy check done, wait for next interval
    }  // end connected branch

    consecutive_failures += 1;  // count this non-connected read
    log_action(  // log the unhealthy state
      'CLIENT_UNHEALTHY',  // event name
      `state=${state} (${consecutive_failures}/${MAX_CONSECUTIVE_FAILURES})`  // state plus failure count
    );  // end log_action call

    if (consecutive_failures >= MAX_CONSECUTIVE_FAILURES) {  // too many failures in a row
      log_action('CLIENT_UNHEALTHY_EXIT', `state=${state}`);  // log the unhealthy exit
      process.exit(1); // systemd Restart=on-failure brings us back fresh
    }  // end failure-threshold check
  }, HEALTH_CHECK_INTERVAL_MS);  // end setInterval, runs every interval

  return { client, get_client_ready: () => client_ready };  // expose the client and a readiness getter
}  // end create_whatsapp_client

module.exports = { create_whatsapp_client };  // export the factory function