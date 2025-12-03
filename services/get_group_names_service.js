// services/group_service.js
const { log_action } = require('../debug/logger');

async function get_group_names(client) {
  try {
    log_action('GROUP_NAMES_ATTEMPT', 'Fetching group chats');
    const chats = await client.getChats();
    const groupChats = chats.filter(chat => chat.isGroup);
    log_action('GROUP_NAMES_SUCCESS', `Found ${groupChats.length} group chats`);
    return groupChats.map(group => ({
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
