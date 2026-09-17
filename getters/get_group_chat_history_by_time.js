/**
 * Fetches a WhatsApp group's messages within a [start_time, end_time] window from
 * live WA Web. WA Web only pages backwards from the newest message, so we page back
 * only until a batch reaches the window's start — never loading the whole history.
 */

const { Message } = require('whatsapp-web.js/src/structures');  // import the Message wrapper class

async function get_group_chat_history_by_time(group_id, start_time, end_time, client) {  // define the windowed history fetcher
    if (!group_id) throw new Error('group_id is required');  // reject a missing group id
    if (!client) throw new Error('client is required');  // reject a missing WA client

    // WA timestamps (msg.t) are Unix seconds; compare in the same unit.
    const from = new Date(start_time).getTime() / 1000;  // window start as Unix seconds
    const to = new Date(end_time).getTime() / 1000;  // window end as Unix seconds
    if (Number.isNaN(from) || Number.isNaN(to)) {  // guard against unparseable dates
        throw new Error('start_time and end_time must be valid date-times');  // fail on invalid input
    }  // end date validation

    // Runs inside the WA Web page, not in Node.
    const raw_messages = await client.pupPage.evaluate(async (chat_id, from, to) => {  // run the fetch inside the WA Web page
        const wid = window.require('WAWebWidFactory').createWid(chat_id);  // build a WID from the chat id
        const cached = window.require('WAWebCollections').Chat.get(wid);  // look up the chat in the local cache
        const chat = cached ?? (await window.require('WAWebFindChatAction').findOrCreateLatestChat(wid))?.chat;  // use cache or fetch/create the chat
        if (!chat) throw new Error(`chat ${chat_id} not found`);  // bail if the chat can't be resolved

        // Page backwards until a batch reaches the window's start (or runs out).
        const load_earlier_msgs = window.require('WAWebChatLoadMessages').loadEarlierMsgs;  // grab the load-earlier-messages fn
        while (true) {  // keep paging until start reached or empty
            const batch = await load_earlier_msgs({ chat, msgCollection: chat.msgs });  // load one older batch
            if (!batch?.length || batch.some(m => m.t <= from)) break;  // stop at window start or exhaustion
        }  // end paging loop

        return chat.msgs.getModelsArray()  // take all loaded message models
            .filter(m => !m.isNotification && m.t >= from && m.t <= to)  // keep real msgs inside the window
            .map(m => window.WWebJS.getMessageModel(m));  // serialize each to a plain model
    }, group_id, from, to);  // pass the args into the page context

    return raw_messages.map(raw => new Message(client, raw));  // wrap raw models as Message instances
}  // end function

module.exports = { get_group_chat_history_by_time };  // export the fetcher
