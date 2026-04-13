async function get_all_group_chat_history(group_id, client) {
    if (!group_id) throw new Error('group_id is required');
    if (!client) throw new Error('client is required');

    const chat = await client.getChatById(group_id);
    if (!chat) throw new Error(`Group chat ${group_id} not found`);

    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const messages = await chat.fetchMessages({ limit: Number.MAX_SAFE_INTEGER });
            console.log('Total messages:', messages.length);
            return messages;
        } catch (err) {
            if (attempt === 3) throw err;
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

module.exports = { get_all_group_chat_history };
