const fs = require('fs');  // Node filesystem module for writing the media file
const path = require('path');  // Node path module for building the save path
const { media_name_creation } = require('../services/media_name_creation_service');  // helper that builds a unique base filename
const { log_action } = require('../debug/logger');  // structured action logger

// Downloads media from a WhatsApp message and saves it to the /media folder.
// Returns the saved filename on success, or null if there is no media or an error occurs.
async function handle_media(client, message) {  // download and save media from a WhatsApp message
    try {  // guard the whole download so a failure never crashes the caller
        log_action('MEDIA_DOWNLOAD_ATTEMPT', `message_id: ${message.id}`);  // record that a download was attempted

        // Store images and documents (PDFs etc.) — both can carry IBAN/SADAD data.
        // Skip audio/ptt/video/sticker (no extractable text, and video is heavy).
        if (message.type !== 'image' && message.type !== 'document') {  // only images and documents carry extractable data
            log_action('MEDIA_DOWNLOAD_SKIP', `type: ${message.type}`);  // note the skipped media type
            return null;  // nothing to download for this type
        }  // end type check

        // Fetch the raw media. downloadMedia returns null when WhatsApp cannot
        // serve the media: mediaStage stays stuck at INIT and a re-request
        // (downloadEvenIfExpensive/rmrReason) is a no-op, so retrying does not
        // help. Seen concentrated on media from certain senders whose blobs WA
        // no longer holds. Log it for visibility instead of dropping it silently.
        const media = await message.downloadMedia().catch(() => null);  // fetch the raw media, null on failure
        if (!media || !media.data) {  // WhatsApp could not serve the media
            log_action('MEDIA_DOWNLOAD_UNRESOLVED', `message_id: ${message.id}`);  // log the unresolved download for visibility
            return null;  // give up, retrying would not help
        }  // end unresolved check

        // Calculate file size from the base64-encoded data (used for naming)
        const media_size = Buffer.byteLength(media.data, 'base64');  // decoded byte size of the media

        // Use the message timestamp if available, otherwise fall back to now
        const media_time = message.timestamp || Date.now();  // message timestamp, or now if missing

        // Generate a unique base filename using the client, size, and time
        const file_name = media_name_creation(client, media_size, media_time);  // build the unique base filename

        // Extract the file extension from the MIME type (e.g. "image/jpeg" -> ".jpeg")
        const ext = media.mimetype ? `.${media.mimetype.split('/')[1]}` : '';  // derive extension from the MIME subtype
        const full_file_name = `${file_name}${ext}`;  // full filename with extension

        // Build the full path to save the file inside the /media directory
        const file_path = path.join(__dirname, '../media', full_file_name);  // absolute path inside the media directory

        // Decode the base64 data and write it to disk
        fs.writeFileSync(file_path, Buffer.from(media.data, 'base64'));  // decode base64 and write the file to disk

        log_action('MEDIA_DOWNLOAD_SUCCESS', `file: ${full_file_name}`);  // record the successful save
        return full_file_name;  // hand the saved filename back to the caller
    } catch (err) {  // any failure lands here
        // Log the error and report it, but don't crash the caller
        log_action('MEDIA_DOWNLOAD_ERROR', err.message);  // log the error message
        console.error('Media download failed:', err);  // print the full error for debugging
        return null;  // signal failure to the caller
    }  // end try/catch
}  // end handle_media

module.exports = {  // export the handler
    handle_media  // the media download/save function
};  // end exports
