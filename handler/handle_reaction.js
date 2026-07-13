// handler/handle_reaction.js
// Policy layer: decides WHICH emoji the bot reacts with on a captured message.
// The bot reacts to every message in a monitored group.
//   IBAN present         → 💳
//   National ID present  → 🪪  (only if no IBAN)
//   SADAD present        → 🧾  (only if no IBAN and no National ID)
//   Otherwise            → 👀  (phone-only or empty message)
// Priority order: IBAN > National ID > SADAD > 👀
// WhatsApp allows only one reaction per user per message, so priority matters.

const react_to_message = require('../services/react_to_message');
const { log_action } = require('../debug/logger');

function pick_emoji({ ibans, national_ids, sadads }) {
    if (ibans.length > 0)        return '💳';
    if (national_ids.length > 0) return '🪪';
    if (sadads.length > 0)       return '🧾';
    return '👀';
}

async function handle_reaction(client, message_id, matches) {
    const emoji = pick_emoji(matches);
    try {
        await react_to_message(client, message_id, emoji);
    } catch (err) {
        // react_to_message already logs the underlying error — this catch keeps the
        // capture path alive if WA is transiently unhappy about the reaction write.
        log_action('HANDLE_REACTION_SUPPRESSED_ERROR', err.message);
    }
}

module.exports = handle_reaction;
