const { error_report } = require('../debug/error_report_service');
const fs = require('fs');
const path = require('path');
const { media_name_creation } = require('../services/media_name_creation_service');
const { log_action } = require('../debug/logger');

// Downloads media from a WhatsApp message and saves it to the /media folder.
// Returns the saved filename on success, or null if there is no media or an error occurs.
async function download_media(client, message) {
    try {
        log_action('MEDIA_DOWNLOAD_ATTEMPT', `message_id: ${message.id}`);

        // Skip messages that don't have any media attached
        if (!message.hasMedia) return null;

        // Fetch the raw media data from WhatsApp
        const media = await message.downloadMedia();

        // If the download returned nothing, bail out early
        if (!media || !media.data) return null;

        // Calculate file size from the base64-encoded data (used for naming)
        const media_size = Buffer.byteLength(media.data, 'base64');

        // Use the message timestamp if available, otherwise fall back to now
        const media_time = message.timestamp || Date.now();

        // Generate a unique base filename using the client, size, and time
        const file_name = media_name_creation(client, media_size, media_time);

        // Extract the file extension from the MIME type (e.g. "image/jpeg" -> ".jpeg")
        const ext = media.mimetype ? `.${media.mimetype.split('/')[1]}` : '';
        const full_file_name = `${file_name}${ext}`;

        // Build the full path to save the file inside the /media directory
        const file_path = path.join(__dirname, '../media', full_file_name);

        // Decode the base64 data and write it to disk
        fs.writeFileSync(file_path, Buffer.from(media.data, 'base64'));

        log_action('MEDIA_DOWNLOAD_SUCCESS', `file: ${full_file_name}`);
        return full_file_name;
    } catch (err) {
        // Log the error and report it, but don't crash the caller
        log_action('MEDIA_DOWNLOAD_ERROR', err.message);
        error_report(null, { error_message: err.message });
        console.error('Media download failed:', err);
        return null;
    }
}

module.exports = {
    download_media
};
