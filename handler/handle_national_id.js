const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const add_or_update_national_id = require('../db/utility/add_or_update_national_id');
const send_unreported_national_id_email = require('../services/send_unreported_national_id_email');
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
const SUBJECT = 'Unreported National ID';

async function handle_national_id(national_ids, body, mid, serialized) {
    try {
        if (national_ids.length > 0) {
            log_action('HANDLE_NATIONAL_ID', `mid: ${mid}, count: ${national_ids.length}`);
            const timestamp = new Date(Date.now() + 3 * 3600 * 1000).toISOString().replace('Z', '+03:00');
            await Promise.all(national_ids.map(national_id_number => {
                const id = crypto.createHash('sha256').update(mid + ':' + national_id_number).digest('hex');
                return add_or_update_national_id({
                    id,
                    FPG_logs_id: mid,
                    national_id_number,
                    original_text: body,
                    created_at: timestamp,
                    updated_at: timestamp,
                });
            }));

            send_unreported_national_id_email(TO, CC, SUBJECT).catch(err =>
                log_action('SEND_UNREPORTED_NATIONAL_ID_EMAIL_ERROR', err.message)
            );
        }

        await new Promise((resolve, reject) => {
            db.run('UPDATE FPG_logs SET is_valid_national_id = ? WHERE _serialized = ?',
                [national_ids.length > 0 ? 1 : 0, serialized],
                err => err ? reject(err) : resolve());
        });
    } catch (err) {
        log_action('HANDLE_NATIONAL_ID_ERROR', `mid: ${mid}, error: ${err.message}`);
    }
}

module.exports = handle_national_id;
