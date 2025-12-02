// services/get_individual_chats_service.js

async function get_individual_chats(client) {
  // Fetch all chats from WhatsApp
  const chats = await client.getChats();

  // Filter only individual (non-group) chats
  const individualChats = chats.filter(chat => !chat.isGroup);

  // Return chat name + id
  return individualChats.map(chat => ({
    id: chat.id._serialized,
    name: chat.name || chat.id.user
  }));
}

module.exports = {
  get_individual_chats
};
