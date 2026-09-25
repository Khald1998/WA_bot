const sqlite3 = require('sqlite3').verbose();                      // load sqlite3 driver in verbose mode
const path = require('path');                                      // load Node's path module
const db = new sqlite3.Database(path.join(__dirname, '../../FPG.db'));  // open the FPG.db SQLite database
db.run('PRAGMA busy_timeout = 5000');                             // wait up to 5s when the db is locked

function get_message_by_serialized(serialized) {                   // fetch one FPG_logs row (mid, _serialized, body) by its _serialized id
    return new Promise((res, rej) =>                               // promisify the single-row lookup
        db.get('SELECT mid, _serialized, body FROM FPG_logs WHERE _serialized = ?', [serialized],  // the bill number lives in the message that was replied to; fetch the quoted bill message row
            (err, row) => err ? rej(err) : res(row)));            // reject on error, else resolve the row (undefined when no match)
}                                                                  // end get_message_by_serialized

module.exports = get_message_by_serialized;                       // export the getter
