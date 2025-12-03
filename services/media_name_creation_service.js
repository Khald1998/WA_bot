const crypto = require('crypto');

function media_name_creation(mediaSize, mediaTime) {
    const currentTime = Date.now();
    const data = `${currentTime}_${mediaSize}_${mediaTime}`;
    return crypto.createHash('sha256').update(data).digest('hex');
}

module.exports = {
    media_name_creation
};
