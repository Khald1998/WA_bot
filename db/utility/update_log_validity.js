const sqlite3 = require('sqlite3').verbose();  // load the sqlite3 driver in verbose mode
const path = require('path');  // load the path helper for building file paths
const db = new sqlite3.Database(path.join(__dirname, '../../FPG.db'));  // open the FPG database
db.run('PRAGMA busy_timeout = 5000');  // wait up to 5s when the db is locked

const COLUMN = {  // whitelist of allowed validity columns — guards against SQL injection via a column name
    iban: 'is_valid_iban',  // IBAN validity flag column
    phone: 'is_valid_phone',  // phone validity flag column
    national_id: 'is_valid_national_id',  // national-id validity flag column
    sadad: 'is_valid_sadad',  // SADAD validity flag column
};  // end column whitelist

function update_log_validity(kind, is_valid, serialized) {  // set one is_valid_* flag on the FPG_logs row keyed by _serialized
    return new Promise((resolve, reject) => {  // wrap the update in a promise
        const column = COLUMN[kind];  // resolve the whitelisted column for this kind
        if (!column) return reject(new Error('update_log_validity: unknown kind ' + kind));  // reject on an unknown kind rather than building unsafe SQL
        db.run(`UPDATE FPG_logs SET ${column} = ? WHERE _serialized = ?`,  // set the validity flag on the matching log row
            [is_valid, serialized],  // the 1/0 flag value and the serialized message id
            err => err ? reject(err) : resolve());  // reject on error, else resolve
    });  // end promise executor
}  // end update_log_validity

module.exports = update_log_validity;  // export the helper
