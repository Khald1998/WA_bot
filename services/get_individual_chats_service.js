const { error_report } = require('./error_report_service');
const SERVICE_FILE_NAME = 'services/get_individual_chats_service.js';
const FUNCTION_NAME = 'get_individual_chats';
// services/get_individual_chats_service.js
const { log_action } = require('../debug/logger');

async function get_individual_chats(client) {
  try {
    log_action('INDIVIDUAL_CHATS_ATTEMPT', 'Fetching individual chats');
    const chats = await client.getChats();
    const individual_chats = chats.filter(chat => !chat.isGroup);
    log_action('INDIVIDUAL_CHATS_SUCCESS', `Found ${individual_chats.length} individual chats`);
    return individual_chats.map(chat => ({
      id: chat.id._serialized,
      name: chat.name || chat.id.user
    }));
  } catch (error) {
    log_action('INDIVIDUAL_CHATS_ERROR', error.message);
    error_report(client, { error_message: error.message });
    return [];
  }
}

module.exports = {
  get_individual_chats
};
