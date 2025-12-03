const { get_sender_phone_number } = require('./helper/get_sender_number');
const { insert_message } = require('../db/database');
const collect_db_message = require('./helper/collect_db_message');
const { download_media } = require('./download_media_service');

async function handle_group_message(client, message) {
    if (message.from === '120363420335889125@g.us') {
        const phoneNumber = await get_sender_phone_number(client, message);
        // Use helper to collect db_message, now including phone_number
        const db_message = collect_db_message(message, phoneNumber);
        // Download media and set media_id
        db_message.media_id = await download_media(message);
        insert_message(db_message);
    }
}

module.exports = {
    handle_group_message
};
