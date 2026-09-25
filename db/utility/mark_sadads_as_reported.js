const { db } = require('../database');                             // shared node:sqlite connection

function mark_sadads_as_reported(sadad_ids) {                      // mark SADAD records as reported: set is_reported=1 for the given SADAD ids
    if (!sadad_ids || sadad_ids.length === 0) {                    // nothing to do when no ids given
        return { changes: 0 };                                     // return zero rows changed
    }                                                              // end empty-input guard

    const placeholders = sadad_ids.map(() => '?').join(',');       // build one ? placeholder per id
    const updated_at = new Date(Date.now() + 3 * 3600 * 1000).toISOString().replace('Z', '+03:00');  // current time as ISO with +03:00 offset

    try {                                                          // guard the synchronous update
        const r = db.prepare(`UPDATE sadad SET is_reported = 1, updated_at = ? WHERE id IN (${placeholders})`).run(updated_at, ...sadad_ids);  // run the update binding the timestamp and ids
        return { changes: r.changes };                             // return the number of rows updated
    } catch (err) {                                                // if the update failed
        console.error('Error marking SADADs as reported:', err.message);  // log the failure message
        throw err;                                                 // rethrow to the caller
    }                                                              // end try/catch
}                                                                  // end mark_sadads_as_reported

module.exports = mark_sadads_as_reported;                          // export the function
