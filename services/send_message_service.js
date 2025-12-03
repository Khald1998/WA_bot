const SERVICE_FILE_NAME = 'services/send_message_service.js';
const FUNCTION_NAME = 'send_message_service';
// Service logic for sending a WhatsApp message
const { log_action } = require('../debug/logger');
function send_message_service(client, number, message) {
  const normalized = number.replace(/\D/g, '');
  // Construct the chat ID (e.g. "966598685983@c.us")
  const chat_id = `${normalized}@c.us`;
  log_action('SEND_MESSAGE_ATTEMPT', `to: ${chat_id}, message: ${message}`);
  return client.sendMessage(chat_id, message)
    .then(() => {
      log_action('SEND_MESSAGE_SUCCESS', `to: ${chat_id}`);
      return { success: true, to: chat_id, message };
    })
    .catch((err) => {
      log_action('SEND_MESSAGE_ERROR', `to: ${chat_id}, error: ${err.message}`);
      throw err;
    });
}

module.exports = { send_message_service };
