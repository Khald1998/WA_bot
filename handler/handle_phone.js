const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const add_or_update_phone = require('../db/utility/add_or_update_phone');
const { log_action } = require('../debug/logger');

const db = new sqlite3.Database(path.join(__dirname, '../FPG.db'));

async function handle_phone(phones, body, mid, serialized) {
    try {
        if (phones.length > 0) {
            log_action('HANDLE_PHONE', `mid: ${mid}, count: ${phones.length}`);
            const timestamp = new Date(Date.now() + 3 * 3600 * 1000).toISOString().replace('Z', '+03:00');
            await Promise.all(phones.map(phone_number => {
                const id = crypto.createHash('sha256').update(mid + ':' + phone_number).digest('hex');
                return add_or_update_phone({
                    id,
                    FPG_logs_id: mid,
                    phone_number,
                    original_text: body,
                    created_at: timestamp,
                    updated_at: timestamp,
                });
            }));
        }

        await new Promise((resolve, reject) => {
            db.run('UPDATE FPG_logs SET is_valid_phone = ? WHERE _serialized = ?',
                [phones.length > 0 ? 1 : 0, serialized],
                err => err ? reject(err) : resolve());
        });
    } catch (err) {
        log_action('HANDLE_PHONE_ERROR', `mid: ${mid}, error: ${err.message}`);
    }
}

module.exports = handle_phone;
