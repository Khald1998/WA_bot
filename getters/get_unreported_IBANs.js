const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '../FPG.db'));
db.run('PRAGMA busy_timeout = 5000');
const mark_ibans_as_reported = require('../db/utility/mark_ibans_as_reported');

// Normalize IBAN: remove spaces and uppercase. Return null for missing values.
function normalize_iban(iban) {
    if (!iban || typeof iban !== 'string') return null;
    return iban.replace(/\s+/g, '').toUpperCase();
}

// Fetch rows where is_reported = 0, ordered by created_at (oldest first).
function fetch_unreported_rows() {
    const query = `
        SELECT id, FPG_logs_id, iban_number, original_text, created_at, updated_at, is_reported
        FROM IBAN
        WHERE is_reported = 0
        ORDER BY created_at ASC
    `;

    return new Promise((resolve, reject) => {
        db.all(query, [], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

// Return deduplicated rows (keep first occurrence). Mark duplicates as reported.
async function get_unreported_ibans() {
    const rows = await fetch_unreported_rows();

    const seen = new Set();
    const keep = [];
    const duplicate_ids = [];

    for (const row of rows) {
        const norm = normalize_iban(row.iban_number);
        if (!norm) {
            // no IBAN value — keep the row
            keep.push(row);
            continue;
        }

        if (seen.has(norm)) {
            // duplicate IBAN: schedule to mark as reported
            duplicate_ids.push(row.id);
        } else {
            seen.add(norm);
            keep.push(row);
        }
    }

    if (duplicate_ids.length > 0) {
        try {
            await mark_ibans_as_reported(duplicate_ids);
            console.log(`Marked ${duplicate_ids.length} duplicate IBAN(s) as reported`);
        } catch (err) {
            console.error('Error marking duplicate IBANs as reported:', err && err.message ? err.message : err);
            // continue — still return deduped rows
        }
    }

    return keep;
}

module.exports = get_unreported_ibans;
