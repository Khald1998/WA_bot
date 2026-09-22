const { log_action } = require('../debug/logger');  // pull in the structured action logger; module attaches a listener to the whatsapp client for incoming messages
const { handle_group_message } = require('./PFG_bussiness_logic');  // pull in the group-message business-logic handler

function attach_message_listener(client) {  // wire up the incoming-message listener on the WA client
    try {  // guard listener setup against runtime errors
        log_action('LISTENER_ATTACHED', 'Message listener attached to client');  // record that the listener is being attached
        client.on('message_create', async message => {  // subscribe to every created/incoming message
            await handle_group_message(client, message);  // hand each message to the group-message handler
        });  // end message_create subscription
    } catch (error) {  // handle any failure while attaching the listener
        log_action('MESSAGE_LISTENER_ERROR', error.message);  // log the error message via the action logger
        console.error('Error in attach_message_listener:', error);  // also print the full error to stderr
    }  // end catch block
}  // end attach_message_listener function

module.exports = attach_message_listener;  // export the listener-attacher as the module's default
