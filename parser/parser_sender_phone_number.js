const SERVICE_FILE_NAME = 'parser/parser_sender_phone_number.js';
const FUNCTION_NAME = 'parser_sender_phone_number';
const { log_action } = require('../debug/logger');

async function parser_sender_phone_number(client, message) {

    try {
        log_action('PARSER_SENDER_PHONE_NUMBER_ATTEMPT', `author: ${message.author}`);
        const contact = await client.getContactLidAndPhone(message.author);
        const phone_number = contact[0].pn;
        log_action('PARSER_SENDER_PHONE_NUMBER_SUCCESS', `author: ${message.author}, phone: ${phone_number}`);
        return phone_number;
    } catch (error) {
        log_action('PARSER_SENDER_PHONE_NUMBER_ERROR', error.message);
        console.error('Error in parser_sender_phone_number:', error);
        return null;
    }
}

module.exports = { parser_sender_phone_number };
