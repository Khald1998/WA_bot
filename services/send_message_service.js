// Service logic for sending a WhatsApp message
const { logAction } = require('../debug/logger');
function send_message_service(client, number, message) {
  // Normalize the number: remove '+' and any non-digit characters
  const normalized = number.replace(/\D/g, '');
  // Construct the chat ID (e.g. "966598685983@c.us")
  const chatId = `${normalized}@c.us`;
  logAction('SEND_MESSAGE_ATTEMPT', `to: ${chatId}, message: ${message}`);
  return client.sendMessage(chatId, message)
    .then(() => {
      logAction('SEND_MESSAGE_SUCCESS', `to: ${chatId}`);
      return { success: true, to: chatId, message };
    })
    .catch((err) => {
      logAction('SEND_MESSAGE_ERROR', `to: ${chatId}, error: ${err.message}`);
      throw err;
    });
}

module.exports = { send_message_service };
