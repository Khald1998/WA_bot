const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const add_or_update_IBAN = require('../db/utility/add_or_update_IBAN');
const send_unreported_iban_email = require('../services/send_unreported_iban_email');
const { log_action } = require('../debug/logger');

const db = new sqlite3.Database(path.join(__dirname, '../FPG.db'));

const TO = [
  'Tbinessa@saib.com.sa',
  'Alhajoojs@saib.com.sa',
  'Hajajalmutairi@saib.com.sa',
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
const SUBJECT = 'Unreported IBAN';

async function handle_iban(ibans, body, mid, serialized) {
    try {
        if (ibans.length > 0) {
            log_action('HANDLE_IBAN', `mid: ${mid}, count: ${ibans.length}`);
            const timestamp = new Date(Date.now() + 3 * 3600 * 1000).toISOString().replace('Z', '+03:00');
            await Promise.all(ibans.map(iban_number => {
                const id = crypto.createHash('sha256').update(mid + ':' + iban_number).digest('hex');
                return add_or_update_IBAN({
                    id,
                    FPG_logs_id: mid,
                    iban_number,
                    original_text: body,
                    created_at: timestamp,
                    updated_at: timestamp,
                });
            }));

            send_unreported_iban_email(TO, CC, SUBJECT).catch(err =>
                log_action('SEND_UNREPORTED_IBAN_EMAIL_ERROR', err.message)
            );
        }

        await new Promise((resolve, reject) => {
            db.run('UPDATE FPG_logs SET is_valid_iban = ? WHERE _serialized = ?',
                [ibans.length > 0 ? 1 : 0, serialized],
                err => err ? reject(err) : resolve());
        });
    } catch (err) {
        log_action('HANDLE_IBAN_ERROR', `mid: ${mid}, error: ${err.message}`);
    }
}

module.exports = handle_iban;
