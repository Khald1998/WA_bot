// OCR an image via the Python RapidOCR engine (which also writes OCR_content) and
// return its text, so the caller can feed it straight into the same parser_iban /
// handle_iban path used for a normal message body.
const { spawn } = require('child_process');
const path = require('path');
const sqlite3 = require('sqlite3');
const { log_action } = require('../debug/logger');

const db = new sqlite3.Database(path.join(__dirname, '../FPG.db'));
db.run('PRAGMA busy_timeout = 5000');

function ocr_image(media_id) {
    return new Promise((resolve) => {
        const p = spawn('/usr/bin/python3', ['/root/whatsapp-bot/parser/ocr_engine.py', media_id], {
            env: { ...process.env, OMP_NUM_THREADS: '1', OPENBLAS_NUM_THREADS: '1' },
            stdio: 'ignore',
        });
        p.on('exit', () => {
            db.get('SELECT image_body FROM OCR_content WHERE media_id = ?', [media_id],
                (err, row) => resolve(err || !row ? '' : (row.image_body || '')));
        });
        p.on('error', (err) => { log_action('OCR_IMAGE_ERROR', err.message); resolve(''); });
    });
}

module.exports = { ocr_image };
