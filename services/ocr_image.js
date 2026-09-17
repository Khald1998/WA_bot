// OCR an image via the Python RapidOCR engine (which also writes OCR_content) and
// return its text, so the caller can feed it straight into the same parser_iban /
// handle_iban path used for a normal message body.
const { spawn } = require('child_process');         // import spawn to run the OCR subprocess
const path = require('path');                       // load the path-join helper
const sqlite3 = require('sqlite3');                 // load the sqlite3 driver
const { log_action } = require('../debug/logger');  // import the action logger helper

const db = new sqlite3.Database(path.join(__dirname, '../FPG.db'));  // open the FPG database
db.run('PRAGMA busy_timeout = 5000');               // wait up to 5s on a locked db

function ocr_image(media_id) {                       // define the OCR-by-media-id function
    return new Promise((resolve) => {                // wrap the async OCR flow in a promise
        const p = spawn('/usr/bin/python3', ['/root/whatsapp-bot/parser/ocr_engine.py', media_id], {  // spawn the Python OCR engine
            env: { ...process.env, OMP_NUM_THREADS: '1', OPENBLAS_NUM_THREADS: '1' },  // pin thread counts to keep OCR single-threaded
            stdio: 'ignore',                         // discard the subprocess stdio
        });                                          // end spawn options
        p.on('exit', () => {                         // when the OCR engine finishes
            db.get('SELECT image_body FROM OCR_content WHERE media_id = ?', [media_id],  // read the OCR text it wrote
                (err, row) => resolve(err || !row ? '' : (row.image_body || '')));  // resolve with the text or empty string
        });                                          // end exit handler
        p.on('error', (err) => { log_action('OCR_IMAGE_ERROR', err.message); resolve(''); });  // on spawn error, log and resolve empty
    });                                              // end promise executor
}                                                    // end function

module.exports = { ocr_image };                      // export the OCR function
