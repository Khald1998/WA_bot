// utility/process_images_ocr.js
// Simple script: get all image media IDs, OCR each image, insert to DB

const path = require('path');
const fs = require('fs');
const Tesseract = require('tesseract.js');
const get_all_image_media_ids = require('../getters/get_all_image_media_ids');
const insert_ocr_content = require('../db/utility/insert_ocr_content');

function fetch_image_ids() {
  return new Promise((resolve, reject) => {
    get_all_image_media_ids((err, ids) => (err ? reject(err) : resolve(ids)));
  });
}

function insert_record(record) {
  return new Promise((resolve, reject) => {
    insert_ocr_content(record, (err) => (err ? reject(err) : resolve()));
  });
}

async function main(limit = 0) {
  const ids = await fetch_image_ids();
  console.log('Found', ids.length, 'image media ids');

  try {
    let processed = 0;
    for (const media_id of ids) {
      if (limit > 0 && processed >= limit) break;
      const file_path = path.join(__dirname, '..', 'media', media_id);
      if (!fs.existsSync(file_path)) {
        console.log('Missing file, skipping:', media_id);
        continue;
      }
      try {
        const { data: { text } } = await Tesseract.recognize(file_path, 'eng');
        await insert_record({ media_id, image_body: (text || '').trim() });
        console.log('OCR inserted for', media_id);
      } catch (err) {
        console.error('OCR failed for', media_id, err && err.message);
      }
      processed += 1;
    }
    console.log('Processing complete. Processed:', processed);
  } finally {
    // nothing to clean up when using top-level recognize
  }
}

const arg = parseInt(process.argv[2], 10);
const limit = isNaN(arg) ? 0 : arg;
main(limit).catch(err => {
  console.error('Fatal error:', err && err.message);
  process.exit(1);
});
