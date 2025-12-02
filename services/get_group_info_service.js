// services/get_group_info_service.js
// Returns info about a group given its JID

/**
 * Get group info by JID
 * @param {object} client - WhatsApp client
 * @param {string} groupJid - Group JID (e.g., '120363420335889125@g.us')
 * @returns {Promise<object|null>} Group info or null if not found
 */
async function get_group_info(client, groupJid) {
    try {
        const chat = await client.getChatById(groupJid);
        if (chat && chat.isGroup) {
            return {
                id: chat.id._serialized,
                name: chat.name,
                participants: chat.participants,
                owner: chat.owner,
                createdAt: chat.createdAt,
                description: chat.description
            };
        }
        return null;
    } catch (err) {
        return null;
    }
}

module.exports = { get_group_info };
