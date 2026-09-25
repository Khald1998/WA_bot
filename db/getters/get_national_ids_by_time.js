const { db } = require('../database');                             // shared node:sqlite connection
const query = `
    SELECT id, FPG_logs_id, national_id_number, original_text, created_at, updated_at
    FROM national_id
    WHERE created_at >= ? AND created_at <= ?
    ORDER BY created_at ASC
`;                                                                 // SELECT national_ids created within a time window, oldest first
const get_national_ids_by_time = (start_time, end_time) => db.prepare(query).all(start_time, end_time);  // run the parameterized query and return the rows synchronously

module.exports = get_national_ids_by_time;                         // export the getter
