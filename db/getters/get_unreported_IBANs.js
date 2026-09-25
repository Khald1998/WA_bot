const { db } = require('../database');  // shared node:sqlite connection
const mark_ibans_as_reported = require('../utility/mark_ibans_as_reported');  // import helper to flag IBAN rows reported

function normalize_iban(iban) {  // define IBAN normalizer; normalize IBAN: remove spaces and uppercase. Return null for missing values.
    if (!iban || typeof iban !== 'string') return null;  // bail out when value is missing or not text
    return iban.replace(/\s+/g, '').toUpperCase();  // strip whitespace and uppercase the IBAN
}  // end normalize_iban

function fetch_unreported_rows() {  // define query for unreported IBAN rows; fetch rows where is_reported = 0, ordered by created_at (oldest first)
    const query = `
        SELECT id, FPG_logs_id, iban_number, original_text, created_at, updated_at, is_reported
        FROM IBAN
        WHERE is_reported = 0
        ORDER BY created_at ASC
    `;  // SQL selecting unreported IBANs oldest first

    return db.prepare(query).all();  // run the SELECT with no bind params and return the rows synchronously
}  // end fetch_unreported_rows

async function get_unreported_ibans() {  // define the dedup + fetch entry point; return deduplicated rows (keep first occurrence), mark duplicates as reported
    const rows = fetch_unreported_rows();  // load all unreported rows from the db

    const seen = new Set();  // track normalized IBANs already kept
    const keep = [];  // rows to return (first occurrence of each IBAN)
    const duplicate_ids = [];  // ids of duplicate rows to mark reported

    for (const row of rows) {  // iterate every unreported row
        const norm = normalize_iban(row.iban_number);  // normalize this row's IBAN
        if (!norm) {  // when there is no usable IBAN value
            keep.push(row);  // retain the row despite missing IBAN; no IBAN value — keep the row
            continue;  // skip dedup logic for this row
        }  // end no-IBAN branch

        if (seen.has(norm)) {  // this normalized IBAN was already kept
            duplicate_ids.push(row.id);  // queue the duplicate row's id; duplicate IBAN — schedule to mark as reported
        } else {  // first time seeing this IBAN
            seen.add(norm);  // remember this IBAN as seen
            keep.push(row);  // keep this first-occurrence row
        }  // end dedup branch
    }  // end row loop

    if (duplicate_ids.length > 0) {  // only if duplicates were found
        try {  // guard the db update
            await mark_ibans_as_reported(duplicate_ids);  // flag duplicate rows as reported
            console.log(`Marked ${duplicate_ids.length} duplicate IBAN(s) as reported`);  // log how many were marked
        } catch (err) {  // on failure to mark duplicates
            console.error('Error marking duplicate IBANs as reported:', err && err.message ? err.message : err);  // log the error message; continue — still return deduped rows
        }  // end try/catch
    }  // end duplicate-handling block

    return keep;  // return the deduplicated rows
}  // end get_unreported_ibans

module.exports = get_unreported_ibans;  // export the getter
