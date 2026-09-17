// handler/handle_reaction.js
// Policy layer: decides WHICH emoji the bot reacts with on a captured message.
// The bot reacts to every message in a monitored group.
//   IBAN present         → 💳
//   National ID present  → 🪪  (only if no IBAN)
//   SADAD present        → 🧾  (only if no IBAN and no National ID)
//   Otherwise            → 👀  (phone-only or empty message)
// Priority order: IBAN > National ID > SADAD > 👀
// WhatsApp allows only one reaction per user per message, so priority matters.

const react_to_message = require('../services/react_to_message');  // import the reaction sender
const { log_action } = require('../debug/logger');  // import the action logger

function pick_emoji({ ibans, national_ids, sadads }) {  // choose the emoji from the matches
    if (ibans.length > 0)        return '💳';  // IBAN present -> card emoji
    if (national_ids.length > 0) return '🪪';  // National ID present -> id emoji
    if (sadads.length > 0)       return '🧾';  // SADAD present -> receipt emoji
    return '👀';  // otherwise -> eyes emoji
}  // end pick_emoji

async function handle_reaction(client, message_id, matches) {  // react to a captured message
    const emoji = pick_emoji(matches);  // pick the emoji for these matches
    try {  // attempt to send the reaction
        await react_to_message(client, message_id, emoji);  // send the reaction to WhatsApp
    } catch (err) {  // on reaction failure
        // react_to_message already logs the underlying error — this catch keeps the
        // capture path alive if WA is transiently unhappy about the reaction write.
        log_action('HANDLE_REACTION_SUPPRESSED_ERROR', err.message);  // log the suppressed error
    }  // end try/catch
}  // end handle_reaction

module.exports = handle_reaction;  // export the handler
