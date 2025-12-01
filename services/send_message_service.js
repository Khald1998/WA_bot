// Service logic for sending a WhatsApp message
function send_message_service(client, number, message) {
  // Normalize the number: remove '+' and any non‐digit characters
  const normalized = number.replace(/\D/g, '');
  // Construct the chat ID (e.g. "966598685983@c.us")
  const chatId = `${normalized}@c.us`;
  return client.sendMessage(chatId, message)
    .then(() => ({ success: true, to: chatId, message }))
    .catch((err) => {
      throw err;
    });
}

module.exports = { send_message_service };
