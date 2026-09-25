const sqlite3 = require('sqlite3').verbose();                      // load the sqlite3 driver
const path = require('path');                                      // load the path-join helper
const db = new sqlite3.Database(path.join(__dirname, '../../FPG.db'));  // open the FPG database
db.run('PRAGMA busy_timeout = 5000');                             // wait up to 5s on a locked db

function get_ocr_content(media_id) {                               // read the OCR text stored for a media_id
    return new Promise((resolve) => {                             // never rejects — resolves '' on error or a missing row
        db.get('SELECT image_body FROM OCR_content WHERE media_id = ?', [media_id],  // read the OCR text the engine wrote
            (err, row) => resolve(err || !row ? '' : (row.image_body || '')));  // resolve with the text or empty string
    });                                                          // end promise executor
}                                                                // end get_ocr_content

module.exports = get_ocr_content;                                // export the getter
