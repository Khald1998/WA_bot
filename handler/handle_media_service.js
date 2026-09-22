const fs = require('fs');  // Node filesystem module for writing the media file
const path = require('path');  // Node path module for building the save path
const { media_name_creation } = require('../services/media_name_creation_service');  // helper that builds a unique base filename
const { log_action } = require('../debug/logger');  // structured action logger

async function handle_media(client, message) {  // download and save media from a WhatsApp message; saves it to the /media folder, returns the saved filename on success, or null if there is no media or an error occurs
    try {  // guard the whole download so a failure never crashes the caller
        log_action('MEDIA_DOWNLOAD_ATTEMPT', `message_id: ${message.id}`);  // record that a download was attempted

        if (message.type !== 'image' && message.type !== 'document') {  // only images and documents carry extractable data; store images and documents (pdfs etc.) — both can carry IBAN/SADAD data, skip audio/ptt/video/sticker (no extractable text, and video is heavy)
            log_action('MEDIA_DOWNLOAD_SKIP', `type: ${message.type}`);  // note the skipped media type
            return null;  // nothing to download for this type
        }  // end type check

        const media = await message.downloadMedia().catch(() => null);  // fetch the raw media, null on failure; downloadMedia returns null when WhatsApp cannot serve the media: mediaStage stays stuck at INIT and a re-request (downloadEvenIfExpensive/rmrReason) is a no-op, so retrying does not help. seen concentrated on media from certain senders whose blobs WA no longer holds. log it for visibility instead of dropping it silently
        if (!media || !media.data) {  // WhatsApp could not serve the media
            log_action('MEDIA_DOWNLOAD_UNRESOLVED', `message_id: ${message.id}`);  // log the unresolved download for visibility
            return null;  // give up, retrying would not help
        }  // end unresolved check

        const media_size = Buffer.byteLength(media.data, 'base64');  // decoded byte size of the media; calculate file size from the base64-encoded data (used for naming)

        const media_time = message.timestamp || Date.now();  // message timestamp, or now if missing; use the message timestamp if available, otherwise fall back to now

        const file_name = media_name_creation(client, media_size, media_time);  // build the unique base filename; generate a unique base filename using the client, size, and time

        const ext = media.mimetype ? `.${media.mimetype.split('/')[1]}` : '';  // derive extension from the MIME subtype; extract the file extension from the mime type (e.g. "image/jpeg" -> ".jpeg")
        const full_file_name = `${file_name}${ext}`;  // full filename with extension

        const file_path = path.join(__dirname, '../media', full_file_name);  // absolute path inside the media directory; build the full path to save the file inside the /media directory

        fs.writeFileSync(file_path, Buffer.from(media.data, 'base64'));  // decode base64 and write the file to disk

        log_action('MEDIA_DOWNLOAD_SUCCESS', `file: ${full_file_name}`);  // record the successful save
        return full_file_name;  // hand the saved filename back to the caller
    } catch (err) {  // any failure lands here
        log_action('MEDIA_DOWNLOAD_ERROR', err.message);  // log the error message; log the error and report it, but don't crash the caller
        console.error('Media download failed:', err);  // print the full error for debugging
        return null;  // signal failure to the caller
    }  // end try/catch
}  // end handle_media

module.exports = {  // export the handler
    handle_media  // the media download/save function
};  // end exports
