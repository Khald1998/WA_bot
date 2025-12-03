const fs = require('fs');
const path = require('path');
const { media_name_creation } = require('./media_name_creation_service');


const { log_action } = require('../debug/logger');
async function download_media(message) {
    try {
        log_action('MEDIA_DOWNLOAD_ATTEMPT', `message_id: ${message.id}`);
        if (!message.hasMedia) return null;
        const media = await message.downloadMedia();
        if (!media || !media.data) return null;
        const mediaSize = Buffer.byteLength(media.data, 'base64');
        const mediaTime = message.timestamp || Date.now();
        const fileName = media_name_creation(mediaSize, mediaTime);
        const ext = media.mimetype ? `.${media.mimetype.split('/')[1]}` : '';
        const fullFileName = `${fileName}${ext}`;
        const filePath = path.join(__dirname, '../media', fullFileName);
        fs.writeFileSync(filePath, Buffer.from(media.data, 'base64'));
        log_action('MEDIA_DOWNLOAD_SUCCESS', `file: ${fullFileName}`);
        return fullFileName;
    } catch (err) {
        log_action('MEDIA_DOWNLOAD_ERROR', err.message);
        console.error('Media download failed:', err);
        return null;
    }
}

module.exports = {
    download_media
};
