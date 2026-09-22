const sqlite3 = require('sqlite3').verbose();  // load the sqlite3 driver in verbose mode
const path = require('path');  // load the path helper for building file paths
const db = new sqlite3.Database(path.join(__dirname, '../../FPG.db'));  // open the FPG database
db.run('PRAGMA busy_timeout = 5000');  // wait up to 5s when the db is locked

function add_or_update_national_id({ id, FPG_logs_id, national_id_number, original_text, created_at, updated_at }) {  // upsert a National ID record; function to add or update National ID records in the database
    const query = `
        INSERT INTO national_id (id, FPG_logs_id, national_id_number, original_text, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            FPG_logs_id = excluded.FPG_logs_id,
            national_id_number = excluded.national_id_number,
            original_text = excluded.original_text,
            updated_at = excluded.updated_at;
    `;  // end the upsert query template

    return new Promise((resolve, reject) => {  // wrap the db write in a promise
        db.run(query, [id, FPG_logs_id, national_id_number, original_text, created_at, updated_at], function (err) {  // run the upsert with bound params
            if (err) {  // if the write failed
                console.error('Error adding/updating National ID:', err.message);  // log the error message
                return reject(err);  // reject the promise with the error
            }  // end error branch
            console.log('National ID record added/updated successfully');  // log success
            resolve();  // resolve the promise
        });  // end db.run callback
    });  // end promise executor
}  // end add_or_update_national_id

module.exports = add_or_update_national_id;  // export the function