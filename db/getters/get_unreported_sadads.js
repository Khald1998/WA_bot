const { db } = require('../database');                             // shared node:sqlite connection
const query = `
    SELECT id, FPG_logs_id, sadad_number, sadad_type, original_text, created_at, updated_at, is_reported
    FROM sadad
    WHERE is_reported = 0
    ORDER BY created_at ASC
`;                                                                 // SELECT all SADAD rows not yet reported (is_reported=0), oldest first
const get_unreported_sadads = () => db.prepare(query).all();       // run the query and return the rows synchronously

module.exports = get_unreported_sadads;                            // export the getter
