// services/get_message_count_in_group_service.js

// This function returns the message count in a group by group_id
async function get_message_count_in_group_service(client, group_id) {
  // Fetch the chat by group_id
  const chat = await client.getChatById(group_id);
  if (!chat) {
    return null;
  }
  // Return the message count (total messages in the group)
  return chat.msgs ? chat.msgs.length : 0;
}

module.exports = {
  get_message_count_in_group_service
};
