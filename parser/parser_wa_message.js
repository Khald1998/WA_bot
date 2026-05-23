const SERVICE_FILE_NAME = 'parser/parser_wa_message.js';
const FUNCTION_NAME = 'parser_wa_message';
// Builds the flat row object for FPG_logs from a whatsapp-web.js Message.
// Also resolves the sender's phone number from the client (best-effort: null on failure).
const { log_action } = require('../debug/logger');
async function parser_wa_message(client, message) {
    try {
        log_action('PARSER_WA_MESSAGE', `mid: ${message.id._serialized}`);

        let phone_number = null;
        try {
            log_action('PARSER_SENDER_PHONE_NUMBER_ATTEMPT', `author: ${message.author}`);
            const contact = await client.getContactLidAndPhone(message.author);
            phone_number = contact[0].pn;
            log_action('PARSER_SENDER_PHONE_NUMBER_SUCCESS', `author: ${message.author}, phone: ${phone_number}`);
        } catch (phone_err) {
            log_action('PARSER_SENDER_PHONE_NUMBER_ERROR', phone_err.message);
            console.error('Error in parser_sender_phone_number:', phone_err);
        }

        return {
            mid: message.id.id,
            from_me: message.fromMe,
            remote: message.from,
            participant: message.author,
            _serialized: message.id._serialized,
            body: message.body,
            type: message.type,
            notify_name: message.notifyName,
            is_new_msg: message.isNewMsg,
            kic_notified: message.kicNotified,
            recv_fresh: message.recvFresh,
            is_from_template: message.isFromTemplate,
            is_ads_media: message.isAdsMedia,
            is_sent_cag_poll_creation: message.isSentCagPollCreation,
            is_vcard_over_mms_document: message.isVcardOverMmsDocument,
            is_forwarded: message.isForwarded,
            is_dynamic_reply_buttons_msg: message.isDynamicReplyButtonsMsg,
            is_carousel_card: message.isCarouselCard,
            is_video_call: message.isVideoCall,
            is_call_link: message.isCallLink,
            is_md_history_msg: message.isMdHistoryMsg,
            is_avatar: message.isAvatar,
            non_jid_mentions: message.nonJidMentions,
            media_key: message.mediaKey,
            has_media: message.hasMedia,
            timestamp: message.timestamp,
            device_type: message.deviceType,
            forwarding_score: message.forwardingScore,
            is_status: message.isStatus,
            is_starred: message.isStarred,
            broadcast: message.broadcast,
            has_quoted_msg: message.hasQuotedMsg,
            duration: message.duration,
            location: message.location,
            is_gif: message.isGif,
            is_ephemeral: message.isEphemeral,
            phone_number,
        };
    } catch (error) {
        log_action('PARSER_WA_MESSAGE_ERROR', error.message);
        console.error('Error in parser_wa_message:', error);
        return null;
    }
}

module.exports = parser_wa_message;
