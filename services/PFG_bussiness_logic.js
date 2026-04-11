const { error_report } = require('../debug/error_report_service');
const SERVICE_FILE_NAME = 'services/PFG_bussiness_logic.js';
const FUNCTION_NAME = 'handle_group_message';
const { get_sender_phone_number } = require('../getters/get_sender_number');
const insert_message = require('../db/utility/insert_message');
const collect_db_message = require('./helper/collect_db_message');
const { download_media } = require('../wa_client_services/download_media_service');
const { log_action } = require('../debug/logger');
async function handle_group_message(client, message) {
    try {
        if (message.from === '120363199265021169@g.us') {
            const phone_number = await get_sender_phone_number(client, message);
            log_action('HANDLE_GROUP_MESSAGE_PHONE', `phone: ${phone_number}`);
            // Use helper to collect db_message, now including phone_number
            const db_message = collect_db_message(message, phone_number);
            // Download media and set media_id
            db_message.media_id = await download_media(client, message);
            log_action('HANDLE_GROUP_MESSAGE_DB_INSERT', `mid: ${db_message.mid}`);
            insert_message(db_message);
        }
        log_action('HANDLE_GROUP_MESSAGE_SUCCESS', `from: ${message.from}`);
    } catch (error) {
        log_action('HANDLE_GROUP_MESSAGE_ERROR', error.message);
        error_report(client, { error_message: error.message });
        console.error('Error in handle_group_message:', error);
    }
}

module.exports = {
    handle_group_message
};
