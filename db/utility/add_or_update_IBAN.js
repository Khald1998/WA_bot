// db/utility/add_or_update_IBAN.js
// Function to add or update IBAN records in the database

const sqlite3 = require('sqlite3').verbose();  // load sqlite3 with verbose stack traces
const path = require('path');  // load path helper for building the db location
const db = new sqlite3.Database(path.join(__dirname, '../../FPG.db'));  // open the FPG database file
db.run('PRAGMA busy_timeout = 5000');  // wait up to 5s if the db is locked

function add_or_update_iban({ id, FPG_logs_id, iban_number, original_text, created_at, updated_at }) {  // upsert one IBAN record from destructured fields
    const query = `
        INSERT INTO IBAN (id, FPG_logs_id, iban_number, original_text, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            FPG_logs_id = excluded.FPG_logs_id,
            iban_number = excluded.iban_number,
            original_text = excluded.original_text,
            updated_at = excluded.updated_at;
    `;  // SQL to insert or update the IBAN row on id conflict

    return new Promise((resolve, reject) => {  // wrap the db write in a promise
        db.run(query, [id, FPG_logs_id, iban_number, original_text, created_at, updated_at], function (err) {  // run the upsert with bound params
            if (err) {  // on a db write error
                console.error('Error adding/updating IBAN:', err.message);  // log the failure message
                return reject(err);  // reject the promise with the error
            }  // end error branch
            console.log('IBAN record added/updated successfully');  // log success
            resolve();  // resolve the promise
        });  // end db.run callback
    });  // end promise executor
}  // end add_or_update_iban

module.exports = add_or_update_iban;  // export the upsert helper