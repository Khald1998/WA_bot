// services/message_listener_service.js
// This module attaches a listener to the WhatsApp client for incoming messages.

function attach_message_listener(client) {
    client.on('message_create', message => {
        console.log(message.body);
    });
}

module.exports = attach_message_listener;
