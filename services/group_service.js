// services/group_service.js

async function get_group_names(client) {
  // Fetch all chats from WhatsApp
  const chats = await client.getChats();

  // Filter only group chats
  const groupChats = chats.filter(chat => chat.isGroup);

  // Return group name + id
  return groupChats.map(group => ({
    id: group.id._serialized,
    name: group.name
  }));
}

module.exports = {
  get_group_names
};
