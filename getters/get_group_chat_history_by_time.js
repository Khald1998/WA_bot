/**
 * Fetches a WhatsApp group's messages within a [start_time, end_time] window from
 * live WA Web. WA Web only pages backwards from the newest message, so we page back
 * only until a batch reaches the window's start — never loading the whole history.
 */

const { Message } = require('whatsapp-web.js/src/structures');

async function get_group_chat_history_by_time(group_id, start_time, end_time, client) {
    if (!group_id) throw new Error('group_id is required');
    if (!client) throw new Error('client is required');

    // WA timestamps (msg.t) are Unix seconds; compare in the same unit.
    const from = new Date(start_time).getTime() / 1000;
    const to = new Date(end_time).getTime() / 1000;
    if (Number.isNaN(from) || Number.isNaN(to)) {
        throw new Error('start_time and end_time must be valid date-times');
    }

    // Runs inside the WA Web page, not in Node.
    const raw_messages = await client.pupPage.evaluate(async (chat_id, from, to) => {
        const wid = window.require('WAWebWidFactory').createWid(chat_id);
        const cached = window.require('WAWebCollections').Chat.get(wid);
        const chat = cached ?? (await window.require('WAWebFindChatAction').findOrCreateLatestChat(wid))?.chat;
        if (!chat) throw new Error(`chat ${chat_id} not found`);

        // Page backwards until a batch reaches the window's start (or runs out).
        const load_earlier_msgs = window.require('WAWebChatLoadMessages').loadEarlierMsgs;
        while (true) {
            const batch = await load_earlier_msgs({ chat, msgCollection: chat.msgs });
            if (!batch?.length || batch.some(m => m.t <= from)) break;
        }

        return chat.msgs.getModelsArray()
            .filter(m => !m.isNotification && m.t >= from && m.t <= to)
            .map(m => window.WWebJS.getMessageModel(m));
    }, group_id, from, to);

    return raw_messages.map(raw => new Message(client, raw));
}

module.exports = { get_group_chat_history_by_time };
