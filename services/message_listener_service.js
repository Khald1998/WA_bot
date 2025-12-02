// services/message_listener_service.js
// This module attaches a listener to the WhatsApp client for incoming messages.


const { get_sender_phone_number } = require('./helper/get_sender_number');
const { insert_message } = require('../db/database');
const collect_db_message = require('./helper/collect_db_message');

function attach_message_listener(client) {
    client.on('message_create', async message => {
        if (message.from === '120363420335889125@g.us') {
            const phoneNumber = await get_sender_phone_number(client, message);
            // Use helper to collect db_message, now including phone_number
            const db_message = collect_db_message(message, phoneNumber);
            insert_message(db_message);
        }
    });
}

module.exports = attach_message_listener;
