// db/utility/get_all_FPG_logs.js
// Returns all FPG_logs entries with selected fields

const sqlite3 = require('sqlite3').verbose();  // sqlite driver in verbose mode
const path = require('path');  // path helper for the DB location
const db_path = path.join(__dirname, '../FPG.db');  // absolute path to the FPG database

function get_all_FPG_logs(callback) {  // fetch all FPG_logs rows via callback
    const db = new sqlite3.Database(db_path, sqlite3.OPEN_READONLY, (err) => {  // open the DB read-only
db.run('PRAGMA busy_timeout = 5000');  // wait up to 5s on a locked DB
        if (err) return callback(err);  // surface an open error to the caller
    });  // end open callback
    const query = `SELECT
        mid,
        from_me,
        remote,
        participant,
        _serialized,
        body,
        type,
        notify_name,
        is_valid_iban,
        is_valid_phone,
        is_valid_national_id,
        is_valid_sadad,
        media_id,
        has_media,
        timestamp,
        device_type,
        forwarding_score,
        is_forwarded
    FROM FPG_logs`;

    db.all(query, [], (err, rows) => {  // run the SELECT for all rows
        db.close();  // release the db handle
        if (err) return callback(err);  // surface a query error to the caller
        callback(null, rows);  // return the fetched rows
    });  // end db.all callback
}  // end function

module.exports = get_all_FPG_logs;  // export the getter
