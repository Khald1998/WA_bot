const SERVICE_FILE_NAME = 'services/PFG_bussiness_logic.js';
const FUNCTION_NAME = 'handle_group_message';
const { parser_sender_phone_number } = require('../parser/parser_sender_phone_number');
const insert_message = require('../db/utility/insert_message');
const parser_wa_message = require('../parser/parser_wa_message');
const { download_media } = require('../wa_client_services/download_media_service');
const { log_action } = require('../debug/logger');
const parser_iban = require('../parser/parser_iban');
const report_new_iban = require('./report_new_iban');
async function handle_group_message(client, message) {
    try {
        if (message.from === '120363199265021169@g.us') {
            const phone_number = await parser_sender_phone_number(client, message);
            log_action('HANDLE_GROUP_MESSAGE_PHONE', `phone: ${phone_number}`);
            // Use helper to collect db_message, now including phone_number
            const db_message = parser_wa_message(message, phone_number);
            // Download media and set media_id
            db_message.media_id = await download_media(client, message);
            log_action('HANDLE_GROUP_MESSAGE_DB_INSERT', `mid: ${db_message.mid}`);
            await insert_message(db_message);

            // Newly arrived IBAN → parse + email it now instead of waiting for the cron tick.
            if (parser_iban(message.body).length > 0) {
                log_action('NEW_IBAN_DETECTED', `mid: ${db_message.mid}`);
                report_new_iban().catch(err => log_action('REPORT_NEW_IBAN_ERROR', err.message));
            }
        }
        log_action('HANDLE_GROUP_MESSAGE_SUCCESS', `from: ${message.from}`);
    } catch (error) {
        log_action('HANDLE_GROUP_MESSAGE_ERROR', error.message);
        console.error('Error in handle_group_message:', error);
    }
}

module.exports = {
    handle_group_message
};
