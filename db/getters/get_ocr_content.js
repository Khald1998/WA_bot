const { db } = require('../database');                             // shared node:sqlite connection
const get_ocr_content = (media_id) => {                            // read the OCR text stored for a media_id, synchronously
    try {                                                         // never throws — ocr_image relies on this
        const row = db.prepare('SELECT image_body FROM OCR_content WHERE media_id = ?').get(media_id);  // read the OCR text the engine wrote
        return row ? (row.image_body || '') : '';               // return the text, or '' on a missing row
    } catch {                                                     // on any error
        return '';                                              // return '' rather than throwing
    }                                                            // end try/catch
};                                                                // end get_ocr_content

module.exports = get_ocr_content;                                 // export the getter
