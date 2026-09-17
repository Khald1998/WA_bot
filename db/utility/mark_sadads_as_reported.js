// db/utility/mark_sadads_as_reported.js
// Function to mark SADAD records as reported (is_reported=1)

const sqlite3 = require('sqlite3').verbose();  // load the sqlite3 driver in verbose mode
const path = require('path');  // load the path helper for building file paths
const db = new sqlite3.Database(path.join(__dirname, '../../FPG.db'));  // open the FPG database
db.run('PRAGMA busy_timeout = 5000');  // wait up to 5s when the db is locked

function mark_sadads_as_reported(sadad_ids) {  // mark the given SADAD ids as reported
    return new Promise((resolve, reject) => {  // wrap the update in a promise
        if (!sadad_ids || sadad_ids.length === 0) {  // when no ids were supplied
            resolve({ changes: 0 });  // resolve immediately with zero changes
            return;  // exit early
        }  // end empty-input guard

        const placeholders = sadad_ids.map(() => '?').join(',');  // build comma-separated ? placeholders
        const updated_at = new Date(Date.now() + 3 * 3600 * 1000).toISOString().replace('Z', '+03:00');  // now in +03:00 as ISO string
        const query = `
            UPDATE sadad
            SET is_reported = 1, updated_at = ?
            WHERE id IN (${placeholders})
        `;  // end the UPDATE query template

        db.run(query, [updated_at, ...sadad_ids], function(err) {  // run the UPDATE with bound params
            if (err) {  // if the update failed
                console.error('Error marking SADADs as reported:', err.message);  // log the error message
                reject(err);  // reject the promise with the error
            } else {  // otherwise the update succeeded
                resolve({ changes: this.changes });  // resolve with the number of rows updated
            }  // end error/success branch
        });  // end db.run callback
    });  // end promise executor
}  // end mark_sadads_as_reported

module.exports = mark_sadads_as_reported;  // export the function
