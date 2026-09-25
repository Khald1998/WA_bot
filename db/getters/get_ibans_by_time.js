const { db } = require('../database');                             // shared node:sqlite connection
const query = `
    SELECT id, FPG_logs_id, iban_number, original_text, created_at, updated_at
    FROM IBAN
    WHERE created_at >= ? AND created_at <= ?
    ORDER BY created_at ASC
`;                                                                 // SELECT IBANs created within a time window, oldest first
const get_ibans_by_time = (start_time, end_time) => db.prepare(query).all(start_time, end_time);  // run the parameterized query and return the rows synchronously

module.exports = get_ibans_by_time;                               // export the getter
