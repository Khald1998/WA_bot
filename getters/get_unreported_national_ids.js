// db/utility/get_unreported_national_ids.js
// Function to retrieve all national_id records with is_reported=0

const sqlite3 = require('sqlite3').verbose();  // load sqlite3 driver in verbose mode
const path = require('path');  // path helper for building the DB file path
const db = new sqlite3.Database(path.join(__dirname, '../FPG.db'));  // open the FPG database connection
db.run('PRAGMA busy_timeout = 5000');  // wait up to 5s when the DB is locked

function get_unreported_national_ids() {  // fetch all national_id rows not yet reported
    return new Promise((resolve, reject) => {  // wrap the async query in a promise
        const query = `
            SELECT id, FPG_logs_id, national_id_number, original_text, created_at, updated_at, is_reported
            FROM national_id
            WHERE is_reported = 0
            ORDER BY created_at ASC
        `;  // end SQL query string

        db.all(query, [], (err, rows) => {  // run the SELECT for unreported national IDs
            if (err) {  // on query error
                console.error('Error fetching unreported national IDs:', err.message);  // log the failure
                reject(err);  // reject the promise with the error
            } else {  // on success
                resolve(rows);  // resolve with the fetched rows
            }  // end error branch
        });  // end db.all callback
    });  // end promise executor
}  // end get_unreported_national_ids

module.exports = get_unreported_national_ids;  // export the getter
