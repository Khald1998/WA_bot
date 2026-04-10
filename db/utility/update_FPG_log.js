// db/utility/update_FPG_log.js
// Updates an FPG_logs entry by _serialized with all fields

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db_path = path.join(__dirname, '../../FPG.db');

function update_fpg_log(_serialized, data, callback) {
    const db = new sqlite3.Database(db_path, sqlite3.OPEN_READWRITE, (err) => {
        if (err) return callback(err);
    });

    const fields = Object.keys(data);
    const set_clause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => data[f]);
    values.push(_serialized);


    const query = `UPDATE FPG_logs SET ${set_clause} WHERE _serialized = ?`;
    db.run(query, values, function(err) {
        db.close();
        if (callback) callback(err, this);
    });
}

module.exports = update_fpg_log;