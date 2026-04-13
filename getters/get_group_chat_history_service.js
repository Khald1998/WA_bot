/**
 * Fetches the full message history of a WhatsApp group.
 *
 * Why this bypasses `chat.fetchMessages()`:
 *   whatsapp-web.js v1.34.6 calls WA Web's internal loader as
 *       WAWebChatLoadMessages.loadEarlierMsgs(chat, chat.msgs)   // positional args
 *   The current WhatsApp Web build changed that API to take a single object:
 *       WAWebChatLoadMessages.loadEarlierMsgs({ chat, msgCollection })
 *   With the old positional call, the function destructures `undefined` and
 *   throws `Cannot read properties of undefined (reading 'waitForChatLoading')`,
 *   so WWJ's `fetchMessages` is effectively broken for this WA Web build.
 *
 * How the live probe confirmed it (see git history for the diag iterations):
 *   - `client.getChatById(group_id)` works — returns the chat model fine.
 *   - Every positional call shape of `loadEarlierMsgs(chat, ...)` failed with
 *     the `waitForChatLoading` error.
 *   - `loadEarlierMsgs({chat, msgCollection: chat.msgs})` returned a batch of
 *     older messages on the first try.
 *
 * What this implementation does:
 *   1. Runs inside `client.pupPage.evaluate` so it can talk to WA Web internals
 *      directly (bypassing WWJ's broken wrapper).
 *   2. Resolves the chat from the in-memory `Chat` collection, falling back to
 *      `findOrCreateLatestChat` on cache miss.
 *   3. Repeatedly calls `loadEarlierMsgs({chat, msgCollection: chat.msgs})`
 *      until it returns an empty batch, meaning WA Web has no more older
 *      messages to hand back.
 *   4. Reads every loaded message via `chat.msgs.getModelsArray()`, filters
 *      notifications, maps through `WWebJS.getMessageModel`, and wraps each in
 *      a WWJ `Message` so downstream callers
 *      (APIs/get_group_chat_history_api.js, validate_chat_completeness.js)
 *      see the same shape WWJ's `fetchMessages` used to return.
 *
 * If you ever upgrade whatsapp-web.js and its `Chat.fetchMessages` starts
 * working again, this file can be deleted and callers can go back to
 * `chat.fetchMessages({ limit: Infinity })`.
 */

const { Message } = require('whatsapp-web.js/src/structures');

async function get_all_group_chat_history(group_id, client) {
    if (!group_id) throw new Error('group_id is required');
    if (!client) throw new Error('client is required');

    // Drop into the puppeteer page and pull everything WA Web has for this group.
    const raw_messages = await client.pupPage.evaluate(load_all_messages_in_browser, group_id);

    // Back in Node: wrap each raw message model as a WWJ Message so callers
    // get the same shape that `chat.fetchMessages()` used to return.
    const messages = raw_messages.map(raw => new Message(client, raw));
    console.log('Total messages:', messages.length);
    return messages;
}

// This function runs inside the puppeteer-controlled WhatsApp Web page, NOT in Node.
// It has no access to any variables from the outer module — only `window` and `chat_id`.
async function load_all_messages_in_browser(chat_id) {
    const wid = window.require('WAWebWidFactory').createWid(chat_id);

    // Prefer the in-memory chat; fall back to the network path if it isn't cached yet.
    const cached_chat = window.require('WAWebCollections').Chat.get(wid);
    const found_chat = cached_chat
        ?? (await window.require('WAWebFindChatAction').findOrCreateLatestChat(wid))?.chat;
    if (!found_chat) throw new Error(`chat ${chat_id} not found`);

    // Walk backwards through history one batch at a time until WA Web has nothing left.
    // Each call prepends the newly-fetched batch to `found_chat.msgs` in place.
    const load_earlier_msgs = window.require('WAWebChatLoadMessages').loadEarlierMsgs;
    while (true) {
        const batch = await load_earlier_msgs({ chat: found_chat, msgCollection: found_chat.msgs });
        if (!batch?.length) break;
    }

    // Drop system notifications and return the raw message models.
    // They're wrapped into WWJ Message instances back in Node.
    return found_chat.msgs
        .getModelsArray()
        .filter(msg => !msg.isNotification)
        .map(msg => window.WWebJS.getMessageModel(msg));
}

module.exports = { get_all_group_chat_history };
