const { db } = require('../database');                             // shared node:sqlite connection

function mark_national_ids_as_reported(national_id_ids) {          // mark national_id records as reported: set is_reported=1 for the given national_id ids
    if (!national_id_ids || national_id_ids.length === 0) {        // nothing to do when no ids given
        return { changes: 0 };                                     // return zero rows changed
    }                                                              // end empty-input guard

    const placeholders = national_id_ids.map(() => '?').join(',');  // build one ? placeholder per id
    const updated_at = new Date(Date.now() + 3 * 3600 * 1000).toISOString().replace('Z', '+03:00');  // current time as ISO with +03:00 offset

    try {                                                          // guard the synchronous update
        const r = db.prepare(`UPDATE national_id SET is_reported = 1, updated_at = ? WHERE id IN (${placeholders})`).run(updated_at, ...national_id_ids);  // run the update binding the timestamp and ids
        return { changes: r.changes };                             // return the number of rows updated
    } catch (err) {                                                // if the update failed
        console.error('Error marking national IDs as reported:', err.message);  // log the failure message
        throw err;                                                 // rethrow to the caller
    }                                                              // end try/catch
}                                                                  // end mark_national_ids_as_reported

module.exports = mark_national_ids_as_reported;                    // export the function
