const { log_action } = require('../debug/logger');  // structured action logger
async function parser_wa_message(client, message) {  // parse a WA message into a flat DB row; builds the flat row object for FPG_logs from a whatsapp-web.js Message; also resolves the sender's phone number from the client (best-effort: null on failure)
    try {  // guard the whole parser against errors
        log_action('PARSER_WA_MESSAGE', `mid: ${message.id['$1']}`);  // log entry with the message id

        let phone_number = null;  // default the sender phone to null
        try {  // best-effort phone resolution
            log_action('PARSER_SENDER_PHONE_NUMBER_ATTEMPT', `author: ${message.author}`);  // log the resolution attempt
            const contact = await client.getContactLidAndPhone(message.author);  // look up the contact's LID and phone
            phone_number = contact[0].pn;  // take the resolved phone number
            log_action('PARSER_SENDER_PHONE_NUMBER_SUCCESS', `author: ${message.author}, phone: ${phone_number}`);  // log the resolved phone
        } catch (phone_err) {  // handle a phone-resolution failure
            log_action('PARSER_SENDER_PHONE_NUMBER_ERROR', phone_err.message);  // log the phone-resolution error
            console.error('Error resolving sender phone:', phone_err);  // print the phone-resolution error
        }  // end phone try/catch

        let quoted_msg_id = null;  // default the quoted-message id to null; serialized id of the message this one replies to (null if not a reply); lets a code-reply be linked back to the quoted bill message later
        if (message.hasQuotedMsg) {  // only if this message quotes another
            try {  // guard the quoted-message lookup
                const quoted = await message.getQuotedMessage();  // fetch the quoted message
                quoted_msg_id = quoted?.id?._serialized ?? quoted?.id?.['$1'] ?? null;  // take its serialized id, else null
            } catch (quote_err) {  // handle a quoted-lookup failure
                log_action('PARSER_QUOTED_MSG_ERROR', quote_err.message);  // log the quoted-lookup error
            }  // end quoted try/catch
        }  // end if hasQuotedMsg

        return {  // build and return the flat DB row
            mid: message.id.id,  // WhatsApp message id
            from_me: message.fromMe,  // whether the bot sent it
            remote: message.from,  // chat/group JID
            participant: message.author,  // sender JID within the group
            _serialized: message.id['$1'],  // fully serialized message id
            body: message.body,  // message text body
            type: message.type,  // message type (chat, image, ...)
            notify_name: message.notifyName,  // sender's display name
            is_new_msg: message.isNewMsg,  // new-message flag
            kic_notified: message.kicNotified,  // KIC notified flag
            recv_fresh: message.recvFresh,  // received-fresh flag
            is_from_template: message.isFromTemplate,  // sent-from-template flag
            is_ads_media: message.isAdsMedia,  // ads-media flag
            is_sent_cag_poll_creation: message.isSentCagPollCreation,  // CAG poll-creation flag
            is_vcard_over_mms_document: message.isVcardOverMmsDocument,  // vcard-over-MMS document flag
            is_forwarded: message.isForwarded,  // forwarded-message flag
            is_dynamic_reply_buttons_msg: message.isDynamicReplyButtonsMsg,  // dynamic reply-buttons flag
            is_carousel_card: message.isCarouselCard,  // carousel-card flag
            is_video_call: message.isVideoCall,  // video-call flag
            is_call_link: message.isCallLink,  // call-link flag
            is_md_history_msg: message.isMdHistoryMsg,  // multi-device history-message flag
            is_avatar: message.isAvatar,  // avatar-message flag
            non_jid_mentions: message.nonJidMentions,  // non-JID mentions
            media_key: message.mediaKey,  // media decryption key
            has_media: message.hasMedia,  // whether it has media
            timestamp: message.timestamp,  // message timestamp
            device_type: message.deviceType,  // sending device type
            forwarding_score: message.forwardingScore,  // forwarding score
            is_status: message.isStatus,  // status-message flag
            is_starred: message.isStarred,  // starred-message flag
            broadcast: message.broadcast,  // broadcast-message flag
            has_quoted_msg: message.hasQuotedMsg,  // whether it quotes another message
            duration: message.duration,  // media duration
            location: message.location,  // attached location
            is_gif: message.isGif,  // GIF flag
            is_ephemeral: message.isEphemeral,  // ephemeral-message flag
            phone_number,  // resolved sender phone number
            quoted_msg_id,  // id of the quoted message, if any
        };  // end returned row object
    } catch (error) {  // catch any failure while parsing
        log_action('PARSER_WA_MESSAGE_ERROR', error.message);  // log the parse error
        console.error('Error in parser_wa_message:', error);  // print the parse error
        return null;  // return null on failure
    }  // end try/catch
}  // end parser_wa_message

module.exports = parser_wa_message;  // export the parser function
