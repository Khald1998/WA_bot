const { db, bind } = require('../database');                       // shared node:sqlite connection + bind coercion helper

const stmt = db.prepare(`
    INSERT INTO IBAN (id, FPG_logs_id, iban_number, original_text, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
        FPG_logs_id = excluded.FPG_logs_id,
        iban_number = excluded.iban_number,
        original_text = excluded.original_text,
        updated_at = excluded.updated_at;
`);                                                               // prepare the upsert-on-id-conflict statement ONCE at module load

function add_or_update_iban({ id, FPG_logs_id, iban_number, original_text, created_at, updated_at }) {  // function to add or update IBAN records in the database; upsert one IBAN record from destructured fields
    try {                                                          // guard the synchronous db write
        stmt.run(...[id, FPG_logs_id, iban_number, original_text, created_at, updated_at].map(bind));  // run the upsert with positional params, coercing boolean/undefined for node:sqlite
        console.log('IBAN record added/updated successfully');    // log success
    } catch (err) {                                               // on a db write error
        console.error('Error adding/updating IBAN:', err.message);  // log the failure message
        throw err;                                                // rethrow so callers see the failure
    }                                                             // end error handling
}                                                                 // end add_or_update_iban

module.exports = add_or_update_iban;                              // export the upsert helper
