// db/utility/mark_ibans_as_reported.js
// Function to mark IBAN records as reported (is_reported=1)

const sqlite3 = require('sqlite3').verbose();  // load the sqlite3 driver in verbose mode
const path = require('path');  // Node path helper for building the db path
const db = new sqlite3.Database(path.join(__dirname, '../../FPG.db'));  // open the shared FPG database
db.run('PRAGMA busy_timeout = 5000');  // wait up to 5s on a locked db before erroring

function mark_ibans_as_reported(iban_ids) {  // set is_reported=1 for the given IBAN ids
    return new Promise((resolve, reject) => {  // wrap the async update in a promise
        if (!iban_ids || iban_ids.length === 0) {  // nothing to do when no ids given
            resolve({ changes: 0 });  // resolve with zero rows changed
            return;  // stop early
        }  // end empty-input guard

        const placeholders = iban_ids.map(() => '?').join(',');  // build one ? placeholder per id
        const updated_at = new Date(Date.now() + 3 * 3600 * 1000).toISOString().replace('Z', '+03:00');  // current time as ISO with +03:00 offset
        const query = `
            UPDATE IBAN
            SET is_reported = 1, updated_at = ?
            WHERE id IN (${placeholders})
        `;  // end SQL update statement text

        db.run(query, [updated_at, ...iban_ids], function(err) {  // run the update binding the timestamp and ids
            if (err) {  // if the update failed
                console.error('Error marking IBANs as reported:', err.message);  // log the failure message
                reject(err);  // reject the promise
            } else {  // otherwise
                resolve({ changes: this.changes });  // resolve with the number of rows updated
            }  // end error/else branch
        });  // end db.run callback
    });  // end promise executor
}  // end mark_ibans_as_reported

module.exports = mark_ibans_as_reported;  // export the function
