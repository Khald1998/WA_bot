const sqlite3 = require('sqlite3').verbose();  // load the sqlite3 driver in verbose mode
const path = require('path');  // load Node's path helper for building the DB path
const { parsePhoneNumberFromString } = require('libphonenumber-js');  // parser used to canonicalise numbers the same way they are stored

const normalize_number = (raw) => { const p = parsePhoneNumberFromString(String(raw), 'SA'); return p ? p.formatInternational() : null; };  // canonicalise an input to the stored international form (e.g. "+966 58 304 9606"), or null if unparseable
const to_ksa_iso = (epoch_seconds) => epoch_seconds == null ? null : new Date((Number(epoch_seconds) + 3 * 3600) * 1000).toISOString().replace('Z', '+03:00');  // format a unix epoch (seconds) as KSA (+03:00) ISO-8601, passing null through unchanged

function phone_lookup(numbers) {  // batch-enrich one or more phone numbers from the DB, keyed by the caller's original input string
    const inputs = Array.isArray(numbers) ? numbers : [numbers];  // accept a single number or an array of them
    const normalized_by_input = inputs.map(normalize_number);  // canonical form for each input, positionally aligned with inputs
    const candidates = [...new Set([...normalized_by_input.filter(Boolean), ...inputs.map(String)])];  // de-duplicated union of canonical forms (skip unparseable nulls) plus raw inputs verbatim

    return new Promise((resolve, reject) => {  // wrap the async lookup in a promise
        const result = {};  // the output object, keyed by original input string
        if (candidates.length === 0) { inputs.forEach(n => { result[n] = { exists: false }; }); return resolve(result); }  // nothing queryable (e.g. empty input) → report every input not found and resolve

        const db = new sqlite3.Database(path.join(__dirname, '../../FPG.db'));  // open the FPG SQLite database
        db.run('PRAGMA busy_timeout = 5000');  // wait up to 5s if the DB is locked instead of failing
        db.all(  // fetch every phone row (with its report time) matching any candidate; aggregate in JS since FPG_logs.mid is not unique
            `SELECT p.phone_number AS phone_number, p.original_text AS original_text, l.timestamp AS ts
             FROM phone p LEFT JOIN FPG_logs l ON l.mid = p.FPG_logs_id
             WHERE p.phone_number IN (${candidates.map(() => '?').join(', ')})`,  // one bind placeholder per candidate value, matching on any candidate stored value
            candidates,  // bind the candidate values
            (err, rows) => {  // handle the query result
                db.close();  // release the DB handle
                if (err) return reject(err);  // reject on error
                inputs.forEach((input, i) => {  // build the per-input enrichment record
                    const mine = rows.filter(r => r.phone_number === normalized_by_input[i] || r.phone_number === String(input));  // rows belonging to this input (canonical or raw match)
                    if (mine.length === 0) { result[input] = { exists: false }; return; }  // not found → exists:false only
                    const timed = mine.filter(r => r.ts != null);  // rows that carry a real message time
                    const tss = timed.map(r => Number(r.ts));  // their timestamps as numbers, computed once for min/max
                    const newest = timed.length ? timed.reduce((a, b) => (Number(b.ts) >= Number(a.ts) ? b : a)) : mine[0];  // most recent timed row, else any row when no timestamps exist
                    result[input] = { exists: true, first_seen: to_ksa_iso(timed.length ? Math.min(...tss) : null), last_seen: to_ksa_iso(timed.length ? Math.max(...tss) : null), original_text: newest.original_text };  // enriched record: earliest/latest report (+03:00) and the most-recent mention's text
                });  // end per-input loop
                resolve(result);  // resolve with the keyed enrichment object
            }  // end db.all callback
        );  // end db.all call
    });  // end promise executor
}  // end phone_lookup

module.exports = phone_lookup;  // export the batch enrichment getter as the module's default
