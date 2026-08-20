// Runs OCR the moment an image arrives, straight from the bot (no shell script).
// Node can't run RapidOCR, so this spawns the Python OCR engine (parser/ocr_engine.py)
// on the new media_id and lets it write OCR_content. Serialized (one OCR process at a
// time) with a small in-memory queue so a burst of images can't spawn many
// model-loading processes at once. Non-blocking so the message handler is never slowed.
const { spawn } = require('child_process');
const { log_action } = require('../debug/logger');

const PY = '/usr/bin/python3';
const ENGINE = '/root/whatsapp-bot/parser/ocr_engine.py';

const queue = [];
let running = false;

function drain() {
    if (running) return;
    const media_id = queue.shift();
    if (!media_id) return;
    running = true;
    try {
        const p = spawn(PY, [ENGINE, media_id], {
            env: { ...process.env, OMP_NUM_THREADS: '1', OPENBLAS_NUM_THREADS: '1' },
            stdio: 'ignore',
        });
        const done = () => { running = false; drain(); };
        p.on('exit', done);
        p.on('error', (err) => { log_action('OCR_RUN_ERROR', err.message); done(); });
    } catch (err) {
        log_action('OCR_RUN_ERROR', err.message);
        running = false;
        drain();
    }
}

// Queue an image for OCR; runs immediately if nothing else is OCR-ing.
function run_ocr(media_id) {
    if (!media_id) return;
    queue.push(media_id);
    drain();
}

module.exports = { run_ocr };
