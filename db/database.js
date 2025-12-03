// db/database.js
// Handles SQLite connection and logic for storing WhatsApp message properties

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const schema = require('./schema/schema');

const dbPath = path.join(__dirname, '../FPG.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(schema);
});

function insert_message(message_obj) {
    const { log_action } = require('../debug/logger');
    try {
        log_action('DB_INSERT_ATTEMPT', `id: ${message_obj.id}`);
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO FPG_logs (
                id, _serialized, from_me, remote, participant, body, type, notify_name, is_new_msg, kic_notified, recv_fresh, is_from_template, is_ads_media, is_sent_cag_poll_creation, is_vcard_over_mms_document, is_forwarded, is_dynamic_reply_buttons_msg, is_carousel_card, is_video_call, is_call_link, is_md_history_msg, is_avatar, non_jid_mentions, media_key, has_media, timestamp, device_type, forwarding_score, is_status, is_starred, broadcast, has_quoted_msg, duration, location, is_gif, is_ephemeral, phone_number, is_processed, media_id
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `);
        stmt.run([
            message_obj.id,
            message_obj._serialized,
            message_obj.from_me,
            message_obj.remote,
            message_obj.participant,
            message_obj.body,
            message_obj.type,
            message_obj.notify_name,
            message_obj.is_new_msg,
            message_obj.kic_notified,
            message_obj.recv_fresh,
            message_obj.is_from_template,
            message_obj.is_ads_media,
            message_obj.is_sent_cag_poll_creation,
            message_obj.is_vcard_over_mms_document,
            message_obj.is_forwarded,
            message_obj.is_dynamic_reply_buttons_msg,
            message_obj.is_carousel_card,
            message_obj.is_video_call,
            message_obj.is_call_link,
            message_obj.is_md_history_msg,
            message_obj.is_avatar,
            message_obj.non_jid_mentions,
            message_obj.media_key,
            message_obj.has_media,
            message_obj.timestamp,
            message_obj.device_type,
            message_obj.forwarding_score,
            message_obj.is_status,
            message_obj.is_starred,
            message_obj.broadcast,
            message_obj.has_quoted_msg,
            message_obj.duration,
            message_obj.location,
            message_obj.is_gif,
            message_obj.is_ephemeral,
            message_obj.phone_number,
            message_obj.is_processed,
            message_obj.media_id
        ]);
        stmt.finalize();
        log_action('DB_INSERT_SUCCESS', `id: ${message_obj.id}`);
    } catch (error) {
        log_action('DB_INSERT_ERROR', error.message);
    }
}

module.exports = {
    db,
    insert_message
};
