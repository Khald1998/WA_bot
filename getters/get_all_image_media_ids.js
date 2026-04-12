// db/utility/get_all_image_media_ids.js
// Returns all distinct media_id values from FPG_logs where the message type is 'image'

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db_path = path.join(__dirname, '../FPG.db');

function get_all_image_media_ids(callback) {
    const db = new sqlite3.Database(db_path, sqlite3.OPEN_READONLY, (err) => {
        if (err) return callback(err);
    });

    const query = `SELECT DISTINCT media_id FROM FPG_logs WHERE type = 'image' AND media_id IS NOT NULL`;

    db.all(query, [], (err, rows) => {
        db.close();
        if (err) return callback(err);
        const ids = rows.map(r => r.media_id);
        callback(null, ids);
    });
}

module.exports = get_all_image_media_ids;
