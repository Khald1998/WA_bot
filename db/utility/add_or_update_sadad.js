const sqlite3 = require('sqlite3').verbose();  // load the sqlite3 driver in verbose mode
const path = require('path');  // load Node's path helper for building the db path
const db = new sqlite3.Database(path.join(__dirname, '../../FPG.db'));  // open the shared FPG database
db.run('PRAGMA busy_timeout = 5000');  // wait up to 5s on a locked db before erroring

function add_or_update_sadad({ id, FPG_logs_id, sadad_number, sadad_type, original_text, created_at, updated_at }) {  // add or update SADAD records in the database: upsert one SADAD record from the given fields
    const query = `
        INSERT INTO sadad (id, FPG_logs_id, sadad_number, sadad_type, original_text, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            FPG_logs_id = excluded.FPG_logs_id,
            sadad_number = excluded.sadad_number,
            -- fill the biller type only when the stored one is empty OR the
            -- '000' placeholder (biller unknown); never overwrite a real code, so
            -- a later post/commentary carrying a wrong code can't clobber the
            -- first labeled one. A later real code DOES replace a '000' placeholder
            -- (and reply-linking can still fill a blank/placeholder).
            sadad_type = CASE WHEN sadad_type IS NULL OR sadad_type = '' OR sadad_type = '000' THEN excluded.sadad_type ELSE sadad_type END,
            original_text = excluded.original_text,
            updated_at = excluded.updated_at;
    `;  // end SQL upsert statement text

    return new Promise((resolve, reject) => {  // wrap the async db write in a promise
        db.run(query, [id, FPG_logs_id, sadad_number, sadad_type, original_text, created_at, updated_at], function (err) {  // run the upsert with bound params
            if (err) {  // if the write failed
                console.error('Error adding/updating SADAD:', err.message);  // log the failure message
                return reject(err);  // reject the promise and stop
            }  // end error branch
            console.log('SADAD record added/updated successfully');  // log success
            resolve();  // resolve the promise
        });  // end db.run callback
    });  // end promise executor
}  // end add_or_update_sadad

module.exports = add_or_update_sadad;  // export the upsert function
