const { error_report } = require('./debugg/error_report_service');
const SERVICE_FILE_NAME = 'services/media_name_creation_service.js';
const FUNCTION_NAME = 'media_name_creation';
const crypto = require('crypto');
const { log_action } = require('../debug/logger');

function media_name_creation(client, media_size, media_time) {
    try {
        const current_time = Date.now();
        const data = `${current_time}_${media_size}_${media_time}`;
        const hash = crypto.createHash('sha256').update(data).digest('hex');
        log_action('MEDIA_NAME_CREATION', `size: ${media_size}, time: ${media_time}, hash: ${hash}`);
        return hash;
    } catch (error) {
        error_report(client, { error_message: error.message });
        console.error('Error in media_name_creation:', error);
        return null;
    }
}

module.exports = {
    media_name_creation
};
