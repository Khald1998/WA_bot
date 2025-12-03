// services/last_message_in_group_service.js

// This function returns the last message in a group by group_id
const { log_action } = require('../debug/logger');
async function last_message_in_group_service(client, group_id) {
  try {
    log_action('LAST_MSG_ATTEMPT', `group_id: ${group_id}`);
    // Fetch the chat by group_id
    const chat = await client.getChatById(group_id);
    if (!chat) {
      log_action('LAST_MSG_ERROR', `Group not found: ${group_id}`);
      return null;
    }
    // Get messages, sorted by timestamp descending
    const messages = await chat.fetchMessages({ limit: 1 });
    if (!messages || messages.length === 0) {
      log_action('LAST_MSG_ERROR', `No messages found in group: ${group_id}`);
      return null;
    }
    log_action('LAST_MSG_SUCCESS', `group_id: ${group_id}, message_id: ${messages[0].id && messages[0].id._serialized}`);
    // Return the last message object
    return messages[0];
  } catch (error) {
    log_action('LAST_MSG_ERROR', error.message);
    console.error('Error in last_message_in_group_service:', error);
    return null;
  }
}

module.exports = {
  last_message_in_group_service
};
