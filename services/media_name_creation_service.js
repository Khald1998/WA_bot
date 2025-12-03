const crypto = require('crypto');
const { log_action } = require('../debug/logger');

function media_name_creation(mediaSize, mediaTime) {
    try {
        const currentTime = Date.now();
        const data = `${currentTime}_${mediaSize}_${mediaTime}`;
        const hash = crypto.createHash('sha256').update(data).digest('hex');
        log_action('MEDIA_NAME_CREATION', `size: ${mediaSize}, time: ${mediaTime}, hash: ${hash}`);
        return hash;
    } catch (error) {
        console.error('Error in media_name_creation:', error);
        return null;
    }
}

module.exports = {
    media_name_creation
};
