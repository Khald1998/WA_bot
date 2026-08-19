const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const add_or_update_sadad = require('../db/utility/add_or_update_sadad');
const send_unreported_sadad_email = require('../services/send_unreported_sadad_email');
const { log_action } = require('../debug/logger');

const db = new sqlite3.Database(path.join(__dirname, '../FPG.db'));

const TO = [
  'Tbinessa@saib.com.sa',
  'Alhajoojs@saib.com.sa',
  'Aalawn@saib.com.sa',
  'Aalsuwayri@saib.com.sa',
  'kalzahrani@saib.com.sa',
  'h.almutairi@saib.com.sa',
  'abdulazizalrayes@saib.com.sa',
  'a.alshebl@saib.com.sa',
  'm.alanazi@saib.com.sa',
  'oalharbi@saib.com.sa'
];
const CC = [
  'aalasmari@saib.com.sa',
  'Analshammari@saib.com.sa',
  'Alharbif@saib.com.sa'
];
const SUBJECT = 'Unreported SADAD';

async function handle_sadad(sadads, body, mid, serialized) {
    try {
        if (sadads.length > 0) {
            log_action('HANDLE_SADAD', `mid: ${mid}, count: ${sadads.length}`);
            const timestamp = new Date(Date.now() + 3 * 3600 * 1000).toISOString().replace('Z', '+03:00');
            await Promise.all(sadads.map(({ sadad_number, sadad_type }) => {
                const id = crypto.createHash('sha256').update(mid + ':' + sadad_number).digest('hex');
                return add_or_update_sadad({
                    id,
                    FPG_logs_id: mid,
                    sadad_number,
                    sadad_type,
                    original_text: body,
                    created_at: timestamp,
                    updated_at: timestamp,
                });
            }));

            send_unreported_sadad_email(TO, CC, SUBJECT).catch(err =>
                log_action('SEND_UNREPORTED_SADAD_EMAIL_ERROR', err.message)
            );
        }

        await new Promise((resolve, reject) => {
            db.run('UPDATE FPG_logs SET is_valid_sadad = ? WHERE _serialized = ?',
                [sadads.length > 0 ? 1 : 0, serialized],
                err => err ? reject(err) : resolve());
        });
    } catch (err) {
        log_action('HANDLE_SADAD_ERROR', `mid: ${mid}, error: ${err.message}`);
    }
}

module.exports = handle_sadad;
