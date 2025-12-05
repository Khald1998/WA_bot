async function get_all_group_chat_history(group_id, client) {
    // Validate required parameters
    if (!group_id) {
        throw new Error('group_id is required');
    }
    if (!client) {
        throw new Error('client is required');
    }

    try {
        // // Get all chats using client.getChats()
        // const chats = await client.getChats();
        
        // // Find the specific group chat by ID
        // const groupChat = chats.find(chat => chat.id._serialized === group_id);
        const groupChat = await client.getChatById(group_id);

        // Check if group chat exists
        if (!groupChat) {
            throw new Error(`Group chat with ID ${group_id} not found`);
        }
        
        // Fetch all messages with no limit (-1 or a very large number)
        const messages = await groupChat.fetchMessages({ limit: Number.MAX_SAFE_INTEGER });
        
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