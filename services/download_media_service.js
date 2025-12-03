const fs = require('fs');
const path = require('path');
const { media_name_creation } = require('./media_name_creation_service');


async function download_media(message) {
    if (!message.hasMedia) return null;
    try {
        const media = await message.downloadMedia();
        if (!media || !media.data) return null;
        const mediaSize = Buffer.byteLength(media.data, 'base64');
        const mediaTime = message.timestamp || Date.now();
        const fileName = media_name_creation(mediaSize, mediaTime);
        const ext = media.mimetype ? `.${media.mimetype.split('/')[1]}` : '';
        const fullFileName = `${fileName}${ext}`;
        const filePath = path.join(__dirname, '../media', fullFileName);
        fs.writeFileSync(filePath, Buffer.from(media.data, 'base64'));
        return fullFileName;
    } catch (err) {
        console.error('Media download failed:', err);
        return null;
    }
}

module.exports = {
    download_media
};
