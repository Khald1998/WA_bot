// services/get_individual_chats_service.js
const { log_action } = require('../debug/logger');

async function get_individual_chats(client) {
  try {
    log_action('INDIVIDUAL_CHATS_ATTEMPT', 'Fetching individual chats');
    const chats = await client.getChats();
    const individualChats = chats.filter(chat => !chat.isGroup);
    log_action('INDIVIDUAL_CHATS_SUCCESS', `Found ${individualChats.length} individual chats`);
    return individualChats.map(chat => ({
      id: chat.id._serialized,
      name: chat.name || chat.id.user
    }));
  } catch (error) {
    log_action('INDIVIDUAL_CHATS_ERROR', error.message);
    return [];
  }
}

module.exports = {
  get_individual_chats
};
