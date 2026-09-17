const SERVICE_FILE_NAME = 'services/media_name_creation_service.js';  // this module's own file path, for logging/reference
const FUNCTION_NAME = 'media_name_creation';  // the exported function's name, for logging/reference
const crypto = require('crypto');  // load Node's crypto module for hashing
const { log_action } = require('../debug/logger');  // pull in the structured action logger

function media_name_creation(client, media_size, media_time) {  // build a deterministic unique name for a media file
    try {  // guard hashing against runtime errors
        const current_time = Date.now();  // capture the current epoch time in ms
        const data = `${current_time}_${media_size}_${media_time}`;  // combine time, size and media timestamp into one seed string
        const hash = crypto.createHash('sha256').update(data).digest('hex');  // SHA-256 the seed and render it as hex
        log_action('MEDIA_NAME_CREATION', `size: ${media_size}, time: ${media_time}, hash: ${hash}`);  // record the inputs and resulting hash
        return hash;  // return the hex hash as the media name
    } catch (error) {  // handle any failure during hashing
        log_action('MEDIA_NAME_CREATION_ERROR', error.message);  // log the error message via the action logger
        console.error('Error in media_name_creation:', error);  // also print the full error to stderr
        return null;  // signal failure to the caller with null
    }  // end catch block
}  // end media_name_creation function

module.exports = {  // expose this module's public API
    media_name_creation  // export the name-creation function
};  // end module.exports object
