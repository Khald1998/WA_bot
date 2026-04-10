const { error_report } = require('./error_report_service');
const SERVICE_FILE_NAME = 'services/download_media_service.js';
const FUNCTION_NAME = 'download_media';
const fs = require('fs');
const path = require('path');
const { media_name_creation } = require('./media_name_creation_service');


const { log_action } = require('../debug/logger');
async function download_media(client, message) {
    try {
        log_action('MEDIA_DOWNLOAD_ATTEMPT', `message_id: ${message.id}`);
        if (!message.hasMedia) return null;
        const media = await message.downloadMedia();
        if (!media || !media.data) return null;
        const media_size = Buffer.byteLength(media.data, 'base64');
        const media_time = message.timestamp || Date.now();
        const file_name = media_name_creation(client, media_size, media_time);
        const ext = media.mimetype ? `.${media.mimetype.split('/')[1]}` : '';
        const full_file_name = `${file_name}${ext}`;
        const file_path = path.join(__dirname, '../media', full_file_name);
        fs.writeFileSync(file_path, Buffer.from(media.data, 'base64'));
        log_action('MEDIA_DOWNLOAD_SUCCESS', `file: ${full_file_name}`);
        return full_file_name;
    } catch (err) {
        log_action('MEDIA_DOWNLOAD_ERROR', err.message);
        error_report(null, { error_message: err.message });
        console.error('Media download failed:', err);
        return null;
    }
}

module.exports = {
    download_media
};
