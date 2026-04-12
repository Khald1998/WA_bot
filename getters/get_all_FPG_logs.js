// db/utility/get_all_FPG_logs.js
// Returns all FPG_logs entries with selected fields

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db_path = path.join(__dirname, '../FPG.db');

function get_all_FPG_logs(callback) {
    const db = new sqlite3.Database(db_path, sqlite3.OPEN_READONLY, (err) => {
        if (err) return callback(err);
    });
    const query = `SELECT 
        mid,
        from_me,
        remote,
        participant,
        _serialized,
        body,
        type,
        notify_name,
        is_processed,
        media_id,
        has_media,
        timestamp,
        device_type,
        forwarding_score,
        is_forwarded
    FROM FPG_logs`;
    
    db.all(query, [], (err, rows) => {
        db.close();
        if (err) return callback(err);
        callback(null, rows);
    });
}

module.exports = get_all_FPG_logs;
