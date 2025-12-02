// db/schema/schema.js
// Defines the SQLite schema for storing WhatsApp message properties

const schema = `
CREATE TABLE IF NOT EXISTS FPG_logs (
    id TEXT PRIMARY KEY,
    from_me BOOLEAN,
    remote TEXT,
    participant TEXT,
    _serialized TEXT,
    body TEXT,
    type TEXT,
    notify_name TEXT,
    is_new_msg BOOLEAN,
    kic_notified BOOLEAN,
    recv_fresh BOOLEAN,
    is_from_template BOOLEAN,
    is_ads_media BOOLEAN,
    is_sent_cag_poll_creation BOOLEAN,
    is_vcard_over_mms_document BOOLEAN,
    is_forwarded BOOLEAN,
    is_dynamic_reply_buttons_msg BOOLEAN,
    is_carousel_card BOOLEAN,
    is_video_call BOOLEAN,
    is_call_link BOOLEAN,
    is_md_history_msg BOOLEAN,
    is_avatar BOOLEAN,
    non_jid_mentions TEXT,
    media_key TEXT,
    has_media BOOLEAN,
    timestamp INTEGER,
    device_type TEXT,
    forwarding_score INTEGER,
    is_status BOOLEAN,
    is_starred BOOLEAN,
    broadcast TEXT,
    has_quoted_msg BOOLEAN,
    duration INTEGER,
    location TEXT,
    is_gif BOOLEAN,
    is_ephemeral BOOLEAN,
    phone_number TEXT
);
`;

module.exports = schema;
