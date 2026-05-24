const SERVICE_FILE_NAME = 'services/PFG_bussiness_logic.js';
const FUNCTION_NAME = 'handle_group_message';
const insert_message = require('../db/utility/insert_message');
const parser_wa_message = require('../parser/parser_wa_message');
const { handle_media } = require('../handler/handle_media_service');
const { log_action } = require('../debug/logger');
const handle_iban = require('../handler/handle_iban');
const handle_phone = require('../handler/handle_phone');
const handle_national_id = require('../handler/handle_national_id');
const handle_sadad = require('../handler/handle_sadad');
const parser_iban = require('../parser/parser_iban');
const parser_phone = require('../parser/parser_phone');
const parser_national_id = require('../parser/parser_national_id');
const parser_sadad = require('../parser/parser_sadad');
async function handle_group_message(client, message) {
    try {
        if (message.from === '120363199265021169@g.us') {
            // Handle media first so the file is on disk before anything else runs.
            const media_id = await handle_media(client, message);
            const db_message = await parser_wa_message(client, message);
            db_message.media_id = media_id;
            await insert_message(db_message);

            const ibans = parser_iban(message.body);
            const phones = parser_phone(message.body);
            const national_ids = parser_national_id(message.body);
            const sadads = parser_sadad(message.body);

            handle_iban(ibans, message.body, db_message.mid, db_message._serialized);
            handle_phone(phones, message.body, db_message.mid, db_message._serialized);
            handle_national_id(national_ids, message.body, db_message.mid, db_message._serialized);
            handle_sadad(sadads, message.body, db_message.mid, db_message._serialized);
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
