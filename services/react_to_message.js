// services/react_to_message.js
// React to a message by its serialized ID.
//
// message_id is the same string stored in FPG_logs._serialized
// (format: "false_<chat>@g.us_<msgId>_<sender>@lid").
//
// emoji is any single emoji. The policy layer (handler/handle_reaction.js)
// picks the emoji per message — this function is a pure primitive and does
// not know or care which emoji is used. Passing '' removes the current
// reaction. WhatsApp allows only one reaction per user per message, so
// re-calling with a different emoji replaces the previous one.
//
// Note: this is a WRITE to the WhatsApp channel. Other group members
// see "🤖 reacted with X". Use deliberately.

const { log_action } = require('../debug/logger');

async function react_to_message(client, message_id, emoji) {
    try {
        await client.sendReaction(message_id, emoji);
        log_action('REACT_SUCCESS', `mid: ${message_id}, emoji: ${emoji || '(cleared)'}`);
        return { success: true, message_id, emoji };
    } catch (err) {
        log_action('REACT_ERROR', `mid: ${message_id}, emoji: ${emoji}, error: ${err.message}`);
        throw err;
    }
}

module.exports = react_to_message;
