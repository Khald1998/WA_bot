const { db } = require('../database');                             // shared node:sqlite connection
const query = `
    SELECT id, FPG_logs_id, national_id_number, original_text, created_at, updated_at, is_reported
    FROM national_id
    WHERE is_reported = 0
    ORDER BY created_at ASC
`;                                                                 // SELECT all national_id rows not yet reported (is_reported=0), oldest first
const get_unreported_national_ids = () => db.prepare(query).all();  // run the query and return the rows synchronously

module.exports = get_unreported_national_ids;                      // export the getter
