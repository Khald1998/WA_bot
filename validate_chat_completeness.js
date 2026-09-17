// =====================================================
// EDIT THESE BEFORE RUNNING:
const GROUP_ID = '120363199265021169@g.us';  // the WhatsApp group to validate
const START_TIME = '2026-05-24T00:00:00+03:00';  // start of the time window to check
const END_TIME = '2026-05-24T23:59:59+03:00';  // end of the time window to check
// =====================================================

const { promisify } = require('util');  // import promisify to wrap callback-style APIs
const { get_group_chat_history_by_time } = require('./getters/get_group_chat_history_by_time');  // load the group-history-by-time getter
const get_all_FPG_logs = promisify(require('./getters/get_all_FPG_logs'));  // load and promisify the FPG-logs getter
const insert_message = require('./db/utility/insert_message');  // load the message-insert helper
const parser_wa_message = require('./parser/parser_wa_message');  // load the WhatsApp-message parser
const { handle_media } = require('./handler/handle_media_service');  // load the media download/attach handler
const { log_action } = require('./debug/logger');  // load the action logger

// Compares the WhatsApp group history within [START_TIME, END_TIME] against the
// database and inserts any messages that are missing. Returns a summary.
async function validate_chat_completeness(client) {  // compare group history to the DB and backfill gaps
    try {  // attempt the fetch-and-backfill work
        log_action('VALIDATE_CHAT_COMPLETENESS_START', `group_id: ${GROUP_ID}, window: ${START_TIME} → ${END_TIME}`);  // log the start with group and time window
        const [whatsapp_messages, db_messages] = await Promise.all([  // fetch WhatsApp history and DB logs in parallel
            get_group_chat_history_by_time(GROUP_ID, START_TIME, END_TIME, client),  // pull the group's messages in the time window
            get_all_FPG_logs()  // pull all message rows already stored in the DB
        ]);  // end Promise.all and destructure both results
        log_action('VALIDATE_CHAT_COMPLETENESS_FETCHED',  // log the fetched counts
            `WhatsApp: ${whatsapp_messages.length}, DB: ${db_messages.length}`);  // the message counts from WhatsApp and the DB

        // Build a Set of already-saved message IDs for O(1) lookups, then find the gaps
        const saved_ids = new Set(db_messages.map(msg => msg._serialized));  // build a Set of saved message IDs for O(1) lookup
        const missing_messages = whatsapp_messages.filter(msg => !saved_ids.has(msg.id._serialized));  // keep only WhatsApp messages not already saved
        log_action('VALIDATE_CHAT_COMPLETENESS_MISSING', `Missing: ${missing_messages.length}`);  // log how many messages are missing

        // Insert each missing message one by one, skipping individual failures so the
        // rest of the batch can still complete
        let inserted_count = 0;  // count of messages successfully inserted
        let error_count = 0;  // count of messages that failed to insert

        for (const message of missing_messages) {  // process each missing message in turn
            try {  // isolate failures to this one message
                const db_message = await parser_wa_message(client, message);  // parse the raw message into a DB row

                // parser_wa_message returns null for message types we don't store
                if (db_message) {  // only proceed if the parser returned a row
                    // Download and attach any media before saving (returns null if no media)
                    db_message.media_id = await handle_media(client, message);  // download any media and attach its id
                    await insert_message(db_message);  // insert the parsed message into the DB
                    inserted_count++;  // tally another successful insert

                    if (inserted_count % 10 === 0) {  // every ten inserts, report progress
                        console.log(`Progress: ${inserted_count}/${missing_messages.length} inserted`);  // print the running progress line
                    }  // end progress-report branch
                }  // end db_message branch
            } catch (error) {  // catch a failure for this single message
                error_count++;  // tally another failed insert
                log_action('VALIDATE_CHAT_COMPLETENESS_INSERT_ERROR',  // log the per-message insert error
                    `${message.id._serialized}: ${error.message}`);  // the failing message id and error text
            }  // end per-message catch
        }  // end for-each-missing-message loop

        log_action('VALIDATE_CHAT_COMPLETENESS_COMPLETE', `Inserted: ${inserted_count}, Errors: ${error_count}`);  // log the final inserted and error counts

        return {  // return a summary of the run
            total_whatsapp_messages: whatsapp_messages.length,  // total messages seen in WhatsApp
            total_db_messages: db_messages.length,  // total messages already in the DB
            missing_messages: missing_messages.length,  // how many messages were missing
            inserted_count,  // how many were inserted
            error_count  // how many failed to insert
        };  // end summary object

    } catch (error) {  // catch fatal errors (e.g. history fetch failed)
        // Only fatal errors (e.g. failed to fetch history) reach here
        log_action('VALIDATE_CHAT_COMPLETENESS_ERROR', error.message);  // log the fatal error
        throw error;  // re-throw so the caller sees the failure
    }  // end outer try/catch
}  // end validate_chat_completeness

module.exports = {  // export the public API
    validate_chat_completeness  // expose the validation function
};  // end module exports
