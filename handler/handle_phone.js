const crypto = require('crypto');  // Node crypto module, used for hashing ids
const sqlite3 = require('sqlite3').verbose();  // load the sqlite3 driver in verbose mode
const path = require('path');  // Node path helper for building the db path
const add_or_update_phone = require('../db/utility/add_or_update_phone');  // upsert helper for phone rows
const { log_action } = require('../debug/logger');  // structured logging helper

const db = new sqlite3.Database(path.join(__dirname, '../FPG.db'));  // open the shared FPG database
db.run('PRAGMA busy_timeout = 5000');  // wait up to 5s on a locked db before erroring

async function handle_phone(phones, body, mid, serialized) {  // persist phone numbers from a message and flag its log row
    try {  // guard the whole operation
        if (phones.length > 0) {  // only persist when phones were found
            log_action('HANDLE_PHONE', `mid: ${mid}, count: ${phones.length}`);  // log the message id and phone count
            const timestamp = new Date(Date.now() + 3 * 3600 * 1000).toISOString().replace('Z', '+03:00');  // current time as ISO with +03:00 offset
            await Promise.all(phones.map(phone_number => {  // upsert every phone in parallel
                const id = crypto.createHash('sha256').update(mid + ':' + phone_number).digest('hex');  // deterministic id from message id + phone
                return add_or_update_phone({  // upsert this phone record
                    id,  // primary key for the row
                    FPG_logs_id: mid,  // link back to the source message
                    phone_number,  // the phone number value
                    original_text: body,  // full message text for context
                    created_at: timestamp,  // creation timestamp
                    updated_at: timestamp,  // last-updated timestamp
                });  // end add_or_update_phone arguments
            }));  // end map and Promise.all
        }  // end phones-present branch

        await new Promise((resolve, reject) => {  // wrap the flag update in a promise
            db.run('UPDATE FPG_logs SET is_valid_phone = ? WHERE _serialized = ?',  // update the phone-valid flag on the log row
                [phones.length > 0 ? 1 : 0, serialized],  // 1 if any phone found else 0, matched by serialized id
                err => err ? reject(err) : resolve());  // reject on error, else resolve
        });  // end promise executor
    } catch (err) {  // on any failure
        log_action('HANDLE_PHONE_ERROR', `mid: ${mid}, error: ${err.message}`);  // log the error details
    }  // end catch
}  // end handle_phone

module.exports = handle_phone;  // export the handler
