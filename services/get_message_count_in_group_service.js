const { error_report } = require('./error_report_service');
const SERVICE_FILE_NAME = 'services/get_message_count_in_group_service.js';
const FUNCTION_NAME = 'get_message_count_in_group_service';
// services/get_message_count_in_group_service.js

const { log_action } = require('../debug/logger');
async function get_message_count_in_group_service(client, group_id) {
  try {
    log_action('MESSAGE_COUNT_ATTEMPT', `group_id: ${group_id}`);
    const chat = await client.getChatById(group_id);
    if (!chat) {
      log_action('MESSAGE_COUNT_ERROR', `Group not found: ${group_id}`);
      return null;
    }
    const count = chat.msgs ? chat.msgs.length : 0;
    log_action('MESSAGE_COUNT_SUCCESS', `group_id: ${group_id}, count: ${count}`);
    return count;
  } catch (error) {
    log_action('MESSAGE_COUNT_ERROR', error.message);
    error_report(client, { error_message: error.message });
    return null;
  }
}

module.exports = {
  get_message_count_in_group_service
};
