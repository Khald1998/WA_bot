const { db, bind } = require('../database');                       // shared node:sqlite connection + bind coercion helper

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
`;                                                                 // upsert one SADAD record; keep a real biller code, only fill a blank/'000'
const stmt = db.prepare(query);                                   // prepare the upsert statement once at module load

function add_or_update_sadad({ id, FPG_logs_id, sadad_number, sadad_type, original_text, created_at, updated_at }) {  // add or update SADAD records in the database: upsert one SADAD record from the given fields
    try {                                                         // guard the synchronous write so we can log like the old driver
        stmt.run(...[id, FPG_logs_id, sadad_number, sadad_type, original_text, created_at, updated_at].map(bind));  // run the upsert with positional, bind-coerced params
        console.log('SADAD record added/updated successfully');   // log success
    } catch (err) {                                               // if the write failed
        console.error('Error adding/updating SADAD:', err.message);  // log the failure message
        throw err;                                                // propagate the error to the caller
    }                                                             // end write guard
}                                                                 // end add_or_update_sadad

module.exports = add_or_update_sadad;                             // export the upsert function
