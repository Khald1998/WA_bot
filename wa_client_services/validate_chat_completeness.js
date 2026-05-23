const { promisify } = require('util');
const { get_all_group_chat_history } = require('../getters/get_group_chat_history_service');
const get_all_FPG_logs = promisify(require('../getters/get_all_FPG_logs'));
const insert_message = require('../db/utility/insert_message');
const parser_wa_message = require('../parser/parser_wa_message');
const { parser_sender_phone_number } = require('../parser/parser_sender_phone_number');
const { download_media } = require('./download_media_service');
const { log_action } = require('../debug/logger');

const GROUP_ID = '120363199265021169@g.us';

// Compares the WhatsApp group history against the database and inserts any messages
// that are missing. Returns a summary of what was found and inserted.
async function validate_chat_completeness(client) {
    try {
        // Fetch the full WhatsApp group history and all saved DB records at the same time
        log_action('VALIDATE_CHAT_COMPLETENESS_START', `group_id: ${GROUP_ID}`);
        const [whatsapp_messages, db_messages] = await Promise.all([
            get_all_group_chat_history(GROUP_ID, client),
            get_all_FPG_logs()
        ]);
        log_action('VALIDATE_CHAT_COMPLETENESS_FETCHED',
            `WhatsApp: ${whatsapp_messages.length}, DB: ${db_messages.length}`);

        // Build a Set of already-saved message IDs for O(1) lookups, then find the gaps
        const saved_ids = new Set(db_messages.map(msg => msg._serialized));
        const missing_messages = whatsapp_messages.filter(msg => !saved_ids.has(msg.id._serialized));
        log_action('VALIDATE_CHAT_COMPLETENESS_MISSING', `Missing: ${missing_messages.length}`);

        // Insert each missing message one by one, skipping individual failures so the
        // rest of the batch can still complete
        let inserted_count = 0;
        let error_count = 0;

        for (const message of missing_messages) {
            try {
                const phone_number = await parser_sender_phone_number(client, message);
                const db_message = parser_wa_message(message, phone_number);

                // parser_wa_message returns null for message types we don't store
                if (db_message) {
                    // Download and attach any media before saving (returns null if no media)
                    db_message.media_id = await download_media(client, message);
                    await insert_message(db_message);
                    inserted_count++;

                    if (inserted_count % 10 === 0) {
                        console.log(`Progress: ${inserted_count}/${missing_messages.length} inserted`);
                    }
                }
            } catch (error) {
                error_count++;
                log_action('VALIDATE_CHAT_COMPLETENESS_INSERT_ERROR',
                    `${message.id._serialized}: ${error.message}`);
            }
        }

        log_action('VALIDATE_CHAT_COMPLETENESS_COMPLETE', `Inserted: ${inserted_count}, Errors: ${error_count}`);

        return {
            total_whatsapp_messages: whatsapp_messages.length,
            total_db_messages: db_messages.length,
            missing_messages: missing_messages.length,
            inserted_count,
            error_count
        };

    } catch (error) {
        // Only fatal errors (e.g. failed to fetch history) reach here
        log_action('VALIDATE_CHAT_COMPLETENESS_ERROR', error.message);
        throw error;
    }
}

module.exports = {
    validate_chat_completeness
};
