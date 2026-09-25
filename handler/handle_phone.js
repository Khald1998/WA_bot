const crypto = require('crypto');  // Node crypto module, used for hashing ids
const add_or_update_phone = require('../db/utility/add_or_update_phone');  // upsert helper for phone rows
const update_log_validity = require('../db/utility/update_log_validity');  // helper to set the is_valid_* flag on the FPG_logs row
const { log_action } = require('../debug/logger');  // structured logging helper

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

        await update_log_validity('phone', phones.length > 0 ? 1 : 0, serialized);  // update the phone-valid flag on the log row
    } catch (err) {  // on any failure
        log_action('HANDLE_PHONE_ERROR', `mid: ${mid}, error: ${err.message}`);  // log the error details
    }  // end catch
}  // end handle_phone

module.exports = handle_phone;  // export the handler
