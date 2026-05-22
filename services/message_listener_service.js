const SERVICE_FILE_NAME = 'services/message_listener_service.js';
const FUNCTION_NAME = 'attach_message_listener';
// services/message_listener_service.js
// This module attaches a listener to the WhatsApp client for incoming messages.

const { log_action } = require('../debug/logger');
const { handle_group_message } = require('./PFG_bussiness_logic');

function attach_message_listener(client) {
    try {
        log_action('LISTENER_ATTACHED', 'Message listener attached to client');
        client.on('message_create', async message => {
            await handle_group_message(client, message);
        });
    } catch (error) {
        log_action('MESSAGE_LISTENER_ERROR', error.message);
        console.error('Error in attach_message_listener:', error);
    }
}

module.exports = attach_message_listener;
