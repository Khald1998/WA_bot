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
const parser_iban_ocr = require('../parser/parser_iban_ocr');
const parser_phone = require('../parser/parser_phone');
const parser_national_id = require('../parser/parser_national_id');
const parser_sadad = require('../parser/parser_sadad');
const { ocr_image } = require('./ocr_image');
// The one group that carries SADAD / bill messages.
const SADAD_GROUP = '120363428576950977@g.us'; // مفوترات

// Groups the bot captures messages from (SADAD_GROUP is monitored too).
const MONITORED_GROUPS = new Set([
    '120363199265021169@g.us', // 🏧جمع الحسابات البنكية المستغلة🏧
    '120363409424227940@g.us', // Test
]);

async function handle_group_message(client, message) {
    try {
        // message.from is the group JID for normal senders, but for users on WhatsApp's
        // LID-only privacy mode it's the sender's @lid — those messages got silently dropped.
        // message.id.remote is always the chat (group) JID, so check both.
        const chat_id = message.id?.remote || message.from;
        if (MONITORED_GROUPS.has(chat_id) || chat_id === SADAD_GROUP) {
            // Handle media first so the file is on disk before anything else runs.
            const media_id = await handle_media(client, message);
            const db_message = await parser_wa_message(client, message);
            db_message.media_id = media_id;
            await insert_message(db_message);

            // IBANs come from two places: the typed message text (clean) and
            // any image's OCR text (needs the garbage-tolerant parser).
            const image_text = media_id ? await ocr_image(media_id) : '';
            const ibans_from_text = parser_iban(message.body);
            const ibans_from_image = parser_iban_ocr(image_text);
            const ibans = [...ibans_from_text, ...ibans_from_image];

            const phones = parser_phone(message.body);
            const national_ids = parser_national_id(message.body);

            // SADAD is only captured in the SADAD group. In other groups a
            // similar-looking bill number is not SADAD, so we skip it.
            const from_sadad_group = chat_id === SADAD_GROUP;
            const sadads = from_sadad_group ? parser_sadad(message.body, true) : [];

            await handle_iban(ibans, message.body, db_message.mid, db_message._serialized);
            await handle_phone(phones, message.body, db_message.mid, db_message._serialized);
            await handle_national_id(national_ids, message.body, db_message.mid, db_message._serialized);
            await handle_sadad(sadads, message.body, db_message.mid, db_message._serialized);
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
