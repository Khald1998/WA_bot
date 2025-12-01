// services/last_message_in_group_service.js

// This function returns the last message in a group by group_id
async function last_message_in_group_service(client, group_id) {
  // Fetch the chat by group_id
  const chat = await client.getChatById(group_id);
  if (!chat) {
    return null;
  }
  // Get messages, sorted by timestamp descending
  const messages = await chat.fetchMessages({ limit: 1 });
  if (!messages || messages.length === 0) {
    return null;
  }
  // Return the last message object
  return messages[0];
}

module.exports = {
  last_message_in_group_service
};
