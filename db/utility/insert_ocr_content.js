// db/utility/insert_ocr_content.js
// Simple helper to insert records into OCR_content table

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db_path = path.join(__dirname, '../../FPG.db');

/**
 * Insert or replace an OCR content record.
 * @param {{media_id: string, image_body: string}} record
 * @param {(err: Error|null) => void} callback
 */
module.exports = function insert_ocr_content(record, callback) {
  if (!record || !record.media_id) {
    return callback(new Error('record.media_id is required'));
  }

  const db = new sqlite3.Database(db_path);
  const sql = `INSERT OR REPLACE INTO OCR_content (media_id, image_body) VALUES (?, ?);`;
  db.run(sql, [record.media_id, record.image_body || ''], function(err) {
    db.close();
    callback(err || null);
  });
};
