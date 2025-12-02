// services/message_listener_service.js
// This module attaches a listener to the WhatsApp client for incoming messages.


const { get_sender_phone_number } = require('./helper/get_sender_number');

function attach_message_listener(client) {
    client.on('message_create', async message => {
        if (message.from === '120363420335889125@g.us') {
            const phoneNumber = await get_sender_phone_number(client, message);
            // Print all required properties
            console.log('fromMe:', message.fromMe);
            console.log('remote:', message.from);
            console.log('id:', message.id && message.id.id);
            console.log('participant:', message.author);
            console.log('_serialized:', message.id && message.id._serialized);
            console.log('body:', message.body);
            console.log('type:', message.type);
            console.log('notifyName:', message.notifyName);
            console.log('isNewMsg:', message.isNewMsg);
            console.log('kicNotified:', message.kicNotified);
            console.log('recvFresh:', message.recvFresh);
            console.log('isFromTemplate:', message.isFromTemplate);
            console.log('isAdsMedia:', message.isAdsMedia);
            console.log('isSentCagPollCreation:', message.isSentCagPollCreation);
            console.log('isVcardOverMmsDocument:', message.isVcardOverMmsDocument);
            console.log('isForwarded:', message.isForwarded);
            console.log('isDynamicReplyButtonsMsg:', message.isDynamicReplyButtonsMsg);
            console.log('isCarouselCard:', message.isCarouselCard);
            console.log('isVideoCall:', message.isVideoCall);
            console.log('isCallLink:', message.isCallLink);
            console.log('isMdHistoryMsg:', message.isMdHistoryMsg);
            console.log('isAvatar:', message.isAvatar);
            console.log('nonJidMentions:', message.nonJidMentions);
            console.log('mediaKey:', message.mediaKey);
            console.log('hasMedia:', message.hasMedia);
            console.log('timestamp:', message.timestamp);
            console.log('deviceType:', message.deviceType);
            console.log('forwardingScore:', message.forwardingScore);
            console.log('isStatus:', message.isStatus);
            console.log('isStarred:', message.isStarred);
            console.log('broadcast:', message.broadcast);
            console.log('hasQuotedMsg:', message.hasQuotedMsg);
            console.log('duration:', message.duration);
            console.log('location:', message.location);
            console.log('isGif:', message.isGif);
            console.log('isEphemeral:', message.isEphemeral);
        }
    });
}

module.exports = attach_message_listener;
