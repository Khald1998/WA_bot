/**
 * Service to fetch all group chat history
 * @file get_all_group_chat_history.js
 */

/**
 * Fetches all chat history from a WhatsApp group with no message limit
 * @param {string} group_id - The group chat ID (format: xxxxx@g.us)
 * @param {Client} client - The WhatsApp Web client instance
 * @returns {Promise<Array>} Array of all messages in the group
 * @throws {Error} If group_id or client is missing, or if fetch fails
 */
async function get_all_group_chat_history(group_id, client) {
    // Validate required parameters
    if (!group_id) {
        throw new Error('group_id is required');
    }
    if (!client) {
        throw new Error('client is required');
    }

    try {
        // Get the chat by ID
        const chat = await client.getChatById(group_id);

        // Verify it's a group chat
        if (!chat.isGroup) {
            throw new Error('The provided chat ID is not a group chat');
        }

        // Fetch all messages with no limit
        // Using Infinity to retrieve all available messages
        const messages = await chat.fetchMessages({ limit: Infinity });

        // Print the number of messages
        console.log('Total messages:', messages.length);
        // Print the first message if available
        if (messages.length > 0) {
            console.log('First message:', messages[0]);
        } else {
            console.log('No messages found.');
        }
        // Return nothing
        return;

    } catch (error) {
        throw new Error(`Failed to fetch group chat history: ${error.message}`);
    }
}

module.exports = {
    get_all_group_chat_history,
};