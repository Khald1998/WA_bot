// services/message_listener_service.js
// This module attaches a listener to the WhatsApp client for incoming messages.


const { get_sender_phone_number } = require('./helper/get_sender_number');

function attach_message_listener(client) {
    client.on('message_create', async message => {
        if (message.from === '120363420335889125@g.us') {
            const phoneNumber = await get_sender_phone_number(client, message);
            console.log(phoneNumber);
            console.log(message.body);
        }
    });
}

module.exports = attach_message_listener;
