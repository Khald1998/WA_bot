// db/utility/insert_message.js
// Utility for inserting a message into the database

const path = require('path');  // Node path helpers for building file paths
const sqlite3 = require('sqlite3').verbose();  // sqlite3 driver in verbose mode
const db_path = path.join(__dirname, '../../FPG.db');  // absolute path to the FPG database file
const db = new sqlite3.Database(db_path);  // open a connection to the FPG database
db.run('PRAGMA busy_timeout = 5000');  // wait up to 5s on a locked db before erroring
const FPG_logs = require('../schema/FPG_logs');  // load the FPG_logs table-creation SQL

// Ensure table exists
db.run(FPG_logs);  // create the FPG_logs table if it is missing

function insert_message(message_obj) {  // insert one message row into FPG_logs
    const { log_action } = require('../../debug/logger');  // pull in the audit logger
    return new Promise((resolve, reject) => {  // wrap the async insert in a promise
        log_action('DB_INSERT_ATTEMPT', `mid: ${message_obj.mid}`);  // log the insert attempt with its mid
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO FPG_logs (
                mid, _serialized, from_me, remote, participant, body, type, notify_name, is_new_msg, kic_notified, recv_fresh, is_from_template, is_ads_media, is_sent_cag_poll_creation, is_vcard_over_mms_document, is_forwarded, is_dynamic_reply_buttons_msg, is_carousel_card, is_video_call, is_call_link, is_md_history_msg, is_avatar, non_jid_mentions, media_key, has_media, timestamp, device_type, forwarding_score, is_status, is_starred, broadcast, has_quoted_msg, duration, location, is_gif, is_ephemeral, phone_number, media_id, quoted_msg_id, is_valid_iban, is_valid_phone, is_valid_national_id, is_valid_sadad
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NULL,NULL,NULL,NULL)
        `);  // finish building the prepared INSERT statement
        stmt.run([  // run the insert binding the values below in column order
            message_obj.mid,  // bind mid (message id)
            message_obj._serialized,  // bind serialized message id
            message_obj.from_me,  // bind from_me flag
            message_obj.remote,  // bind remote chat id
            message_obj.participant,  // bind participant (group sender)
            message_obj.body,  // bind message body text
            message_obj.type,  // bind message type
            message_obj.notify_name,  // bind sender notify name
            message_obj.is_new_msg,  // bind is_new_msg flag
            message_obj.kic_notified,  // bind kic_notified flag
            message_obj.recv_fresh,  // bind recv_fresh flag
            message_obj.is_from_template,  // bind is_from_template flag
            message_obj.is_ads_media,  // bind is_ads_media flag
            message_obj.is_sent_cag_poll_creation,  // bind poll-creation flag
            message_obj.is_vcard_over_mms_document,  // bind vcard-over-mms flag
            message_obj.is_forwarded,  // bind is_forwarded flag
            message_obj.is_dynamic_reply_buttons_msg,  // bind dynamic reply buttons flag
            message_obj.is_carousel_card,  // bind carousel card flag
            message_obj.is_video_call,  // bind video call flag
            message_obj.is_call_link,  // bind call link flag
            message_obj.is_md_history_msg,  // bind md history message flag
            message_obj.is_avatar,  // bind avatar flag
            message_obj.non_jid_mentions,  // bind non-jid mentions
            message_obj.media_key,  // bind media decryption key
            message_obj.has_media,  // bind has_media flag
            message_obj.timestamp,  // bind message timestamp
            message_obj.device_type,  // bind sender device type
            message_obj.forwarding_score,  // bind forwarding score
            message_obj.is_status,  // bind status broadcast flag
            message_obj.is_starred,  // bind starred flag
            message_obj.broadcast,  // bind broadcast flag
            message_obj.has_quoted_msg,  // bind has_quoted_msg flag
            message_obj.duration,  // bind media duration
            message_obj.location,  // bind location payload
            message_obj.is_gif,  // bind is_gif flag
            message_obj.is_ephemeral,  // bind ephemeral flag
            message_obj.phone_number,  // bind parsed phone number
            message_obj.media_id,  // bind associated media id
            message_obj.quoted_msg_id  // bind quoted message id (last bound value)
        ], function(err) {  // callback fired after the insert completes
            stmt.finalize();  // release the prepared statement
            if (err) {  // if the insert failed
                log_action('DB_INSERT_ERROR', err.message);  // log the db error
                return reject(err);  // reject the promise with the error
            }  // end the error branch
            log_action('DB_INSERT_SUCCESS', `mid: ${message_obj.mid}`);  // log the successful insert
            resolve();  // resolve the promise on success
        });  // end stmt.run callback
    });  // end promise executor
}  // end insert_message function

module.exports = insert_message;  // export the insert function
