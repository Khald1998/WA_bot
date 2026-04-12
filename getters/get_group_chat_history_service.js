async function get_all_group_chat_history(group_id, client) {
    // Validate required parameters
    if (!group_id) {
        throw new Error('group_id is required');
    }
    if (!client) {
        throw new Error('client is required');
    }

    try {
        const group_chat = await client.getChatById(group_id);

        // Check if group chat exists
        if (!group_chat) {
            throw new Error(`Group chat with ID ${group_id} not found`);
        }

        // Retry fetchMessages with delay — CLIENT_READY fires before WhatsApp Web internals are fully loaded
        let messages;
        const maxRetries = 3;
        for (let i = 0; i < maxRetries; i++) {
            try {
                messages = await group_chat.fetchMessages({ limit: Number.MAX_SAFE_INTEGER });
                break;
            } catch (fetchErr) {
                if (i === maxRetries - 1) throw fetchErr;
                await new Promise(r => setTimeout(r, 5000));
            }
        }

        // Print the number of messages
        console.log('Total messages:', messages.length);

        // Return raw messages
        return messages;

    } catch (error) {
        throw new Error(`Failed to fetch group chat history: ${error.message}`);
    }
}

module.exports = {
    get_all_group_chat_history,
};