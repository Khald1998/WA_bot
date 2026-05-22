const SERVICE_FILE_NAME = 'getters/get_group_names_service.js';
const FUNCTION_NAME = 'get_group_names';
const { log_action } = require('../debug/logger');

async function get_group_names(client) {
  try {
    log_action('GROUP_NAMES_ATTEMPT', 'Fetching group chats');
    const chats = await client.getChats();
    const group_chats = chats.filter(chat => chat.isGroup);
    log_action('GROUP_NAMES_SUCCESS', `Found ${group_chats.length} group chats`);
    return group_chats.map(group => ({
      id: group.id._serialized,
      name: group.name
    }));
    } catch (error) {
      log_action('GROUP_NAMES_ERROR', error.message);
      return [];
  }
}

module.exports = {
  get_group_names
};
