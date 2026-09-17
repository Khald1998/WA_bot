const insert_message = require('../db/utility/insert_message');  // DB helper that writes a message row
const parser_wa_message = require('../parser/parser_wa_message');  // turns a WA Message into a flat DB row
const { handle_media } = require('../handler/handle_media_service');  // downloads and archives attached media
const { log_action } = require('../debug/logger');  // structured action logger
const handle_iban = require('../handler/handle_iban');  // stores and reports extracted IBANs
const handle_phone = require('../handler/handle_phone');  // stores and reports extracted phone numbers
const handle_national_id = require('../handler/handle_national_id');  // stores and reports extracted national IDs
const handle_sadad = require('../handler/handle_sadad');  // stores and reports extracted SADAD bills
const parser_iban = require('../parser/parser_iban');  // extracts IBANs from typed text
const parser_iban_ocr = require('../parser/parser_iban_ocr');  // extracts IBANs from OCR text
const parser_phone = require('../parser/parser_phone');  // extracts phone numbers from text
const parser_national_id = require('../parser/parser_national_id');  // extracts national IDs from text
const parser_sadad = require('../parser/parser_sadad');  // extracts SADAD bills from typed text
const parser_sadad_ocr = require('../parser/parser_sadad_ocr');  // extracts SADAD bills from OCR text
const link_quoted_sadad_code = require('./link_quoted_sadad_code');  // fills a quoted bill's blank code later
const { ocr_image } = require('./ocr_image');  // runs OCR on a stored image and returns its text
// The one group that carries SADAD / bill messages.
const SADAD_GROUP = '120363428576950977@g.us'; // مفوترات

// Groups the bot captures messages from (SADAD_GROUP is monitored too).
const MONITORED_GROUPS = new Set([  // set of group JIDs the bot captures messages from
    '120363199265021169@g.us', // 🏧جمع الحسابات البنكية المستغلة🏧
    '120363409424227940@g.us', // Test
]);  // end MONITORED_GROUPS set

async function handle_group_message(client, message) {  // entry point for each incoming group message
    try {  // guard the whole handler against errors
        // message.from is the group JID for normal senders, but for users on WhatsApp's
        // LID-only privacy mode it's the sender's @lid — those messages got silently dropped.
        // message.id.remote is always the chat (group) JID, so check both.
        const chat_id = message.id?.remote || message.from;  // resolve the chat JID (works for @lid senders)
        if (MONITORED_GROUPS.has(chat_id) || chat_id === SADAD_GROUP) {  // only process monitored or SADAD groups
            // Handle media first so the file is on disk before anything else runs.
            const media_id = await handle_media(client, message);  // download any media, get its stored id
            const db_message = await parser_wa_message(client, message);  // build the DB row from the WA message
            db_message.media_id = media_id;  // attach the media id to the row
            await insert_message(db_message);  // persist the message row to the DB

            // IBANs come from two places: the typed message text (clean) and
            // any image's OCR text (needs the garbage-tolerant parser).
            const image_text = media_id ? await ocr_image(media_id) : '';  // OCR the image if present, else empty
            const ibans_from_text = parser_iban(message.body);  // parse IBANs from the typed body
            const ibans_from_image = parser_iban_ocr(image_text);  // parse IBANs from the OCR text
            const ibans = [...ibans_from_text, ...ibans_from_image];  // combine IBANs from both sources

            const phones = parser_phone(message.body);  // parse phone numbers from the body
            const national_ids = parser_national_id(message.body);  // parse national IDs from the body

            // SADAD is only captured in the SADAD group. In other groups a
            // similar-looking bill number is not SADAD, so we skip it. In the
            // group, bills come from typed text AND any image's OCR (a bill table
            // is often posted as an image with the biller code in its header).
            const from_sadad_group = chat_id === SADAD_GROUP;  // true only in the SADAD/bills group
            // A bill with no biller code is skipped entirely (not stored). Its code
            // may still arrive later as a reply — see the reply-linking below.
            const sadads = from_sadad_group  // extract bills only when in the SADAD group
                ? [...parser_sadad(message.body, true), ...parser_sadad_ocr(image_text, true)]  // bills from text and OCR
                    .filter(s => s.sadad_type !== '')  // drop bills that have no biller code
                : [];  // otherwise no bills

            await handle_iban(ibans, message.body, db_message.mid, db_message._serialized);  // store and report the IBANs
            await handle_phone(phones, message.body, db_message.mid, db_message._serialized);  // store and report the phones
            await handle_national_id(national_ids, message.body, db_message.mid, db_message._serialized);  // store and report the national IDs
            await handle_sadad(sadads, message.body, db_message.mid, db_message._serialized);  // store and report the SADAD bills

            // Reply-based code linking: if THIS message carries a biller code and
            // replies to an earlier bill message, fill that quoted bill's blank
            // code — e.g. someone replies to a code-less bill with "لمفوتر 050".
            if (from_sadad_group && db_message.quoted_msg_id) {  // only when this bill message is a reply
                const reply_code = parser_sadad.extract_sadad_code(message.body)  // pull a biller code from the reply text
                    || parser_sadad.extract_sadad_code(image_text);  // else fall back to the reply image's OCR
                if (reply_code) {  // only if a code was actually found
                    await link_quoted_sadad_code(db_message.quoted_msg_id, reply_code);  // fill the quoted bill's blank code
                }  // end if reply_code
            }  // end reply-linking block
        }  // end monitored-group block
        log_action('HANDLE_GROUP_MESSAGE_SUCCESS', `from: ${message.from}`);  // log successful handling
    } catch (error) {  // catch any failure in the handler
        log_action('HANDLE_GROUP_MESSAGE_ERROR', error.message);  // log the error message
        console.error('Error in handle_group_message:', error);  // print the error with stack
    }  // end try/catch
}  // end handle_group_message

module.exports = {  // expose this module's public API
    handle_group_message  // the group-message handler
};  // end module.exports
