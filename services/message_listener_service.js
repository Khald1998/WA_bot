// services/message_listener_service.js
// This module attaches a listener to the WhatsApp client for incoming messages.


const { handle_group_message } = require('./PFG_bussiness_logic');

function attach_message_listener(client) {
    client.on('message_create', async message => {
        await handle_group_message(client, message);
    });
}

module.exports = attach_message_listener;
