const { spawn } = require('child_process');         // import spawn to run the OCR subprocess; module OCRs an image via the Python RapidOCR engine (which also writes OCR_content) and returns its text, so the caller can feed it straight into the same parser_iban / handle_iban path used for a normal message body
const get_ocr_content = require('../db/getters/get_ocr_content');  // read back the OCR text the engine wrote for a media_id
const { log_action } = require('../debug/logger');  // import the action logger helper

function ocr_image(media_id) {                       // define the OCR-by-media-id function
    return new Promise((resolve) => {                // wrap the async OCR flow in a promise
        const p = spawn('/usr/bin/python3', ['/root/whatsapp-bot/parser/ocr_engine.py', media_id], {  // spawn the Python OCR engine
            env: { ...process.env, OMP_NUM_THREADS: '1', OPENBLAS_NUM_THREADS: '1' },  // pin thread counts to keep OCR single-threaded
            stdio: 'ignore',                         // discard the subprocess stdio
        });                                          // end spawn options
        p.on('exit', () => {                         // when the OCR engine finishes
            resolve(get_ocr_content(media_id));  // read the OCR text it wrote and resolve with it ('' when missing/error)
        });                                          // end exit handler
        p.on('error', (err) => { log_action('OCR_IMAGE_ERROR', err.message); resolve(''); });  // on spawn error, log and resolve empty
    });                                              // end promise executor
}                                                    // end function

module.exports = { ocr_image };                      // export the OCR function
