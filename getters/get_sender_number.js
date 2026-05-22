const SERVICE_FILE_NAME = 'getters/get_sender_number.js';
const FUNCTION_NAME = 'get_sender_phone_number';
const { log_action } = require('../debug/logger');

async function get_sender_phone_number(client, message) {
    
    try {
        log_action('GET_SENDER_NUMBER_ATTEMPT', `author: ${message.author}`);
        const contact = await client.getContactLidAndPhone(message.author);
        const phone_number = contact[0].pn;
        log_action('GET_SENDER_NUMBER_SUCCESS', `author: ${message.author}, phone: ${phone_number}`);
        return phone_number;
    } catch (error) {
        log_action('GET_SENDER_NUMBER_ERROR', error.message);
        console.error('Error in get_sender_phone_number:', error);
        return null;
    }
}

module.exports = { get_sender_phone_number };
