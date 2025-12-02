// db/database.js
// Handles SQLite connection and logic for storing WhatsApp message properties

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const schema = require('./schema/schema');

const dbPath = path.join(__dirname, 'messages.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(schema);
});

function insert_message(messageObj) {
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO FPG_logs (
            id, from_me, remote, participant, _serialized, body, type, notify_name, is_new_msg, kic_notified, recv_fresh, is_from_template, is_ads_media, is_sent_cag_poll_creation, is_vcard_over_mms_document, is_forwarded, is_dynamic_reply_buttons_msg, is_carousel_card, is_video_call, is_call_link, is_md_history_msg, is_avatar, non_jid_mentions, media_key, has_media, timestamp, device_type, forwarding_score, is_status, is_starred, broadcast, has_quoted_msg, duration, location, is_gif, is_ephemeral, phone_number
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    stmt.run([
        messageObj.id,
        messageObj.from_me,
        messageObj.remote,
        messageObj.participant,
        messageObj._serialized,
        messageObj.body,
        messageObj.type,
        messageObj.notify_name,
        messageObj.is_new_msg,
        messageObj.kic_notified,
        messageObj.recv_fresh,
        messageObj.is_from_template,
        messageObj.is_ads_media,
        messageObj.is_sent_cag_poll_creation,
        messageObj.is_vcard_over_mms_document,
        messageObj.is_forwarded,
        messageObj.is_dynamic_reply_buttons_msg,
        messageObj.is_carousel_card,
        messageObj.is_video_call,
        messageObj.is_call_link,
        messageObj.is_md_history_msg,
        messageObj.is_avatar,
        messageObj.non_jid_mentions,
        messageObj.media_key,
        messageObj.has_media,
        messageObj.timestamp,
        messageObj.device_type,
        messageObj.forwarding_score,
        messageObj.is_status,
        messageObj.is_starred,
        messageObj.broadcast,
        messageObj.has_quoted_msg,
        messageObj.duration,
        messageObj.location,
        messageObj.is_gif,
        messageObj.is_ephemeral,
        messageObj.phone_number
    ]);
    stmt.finalize();
}

module.exports = {
    db,
    insert_message
};
