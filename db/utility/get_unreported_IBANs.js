const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./FPG.db');
const markIbansAsReported = require('./mark_ibans_as_reported');

// Normalize IBAN: remove spaces and uppercase. Return null for missing values.
function normalizeIban(iban) {
    if (!iban || typeof iban !== 'string') return null;
    return iban.replace(/\s+/g, '').toUpperCase();
}

// Fetch rows where is_reported = 0, ordered by created_at (oldest first).
function fetchUnreportedRows() {
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
async function getUnreportedIBANs() {
    const rows = await fetchUnreportedRows();

    const seen = new Set();
    const keep = [];
    const duplicateIds = [];

    for (const row of rows) {
        const norm = normalizeIban(row.iban_number);
        if (!norm) {
            // no IBAN value — keep the row
            keep.push(row);
            continue;
        }

        if (seen.has(norm)) {
            // duplicate IBAN: schedule to mark as reported
            duplicateIds.push(row.id);
        } else {
            seen.add(norm);
            keep.push(row);
        }
    }

    if (duplicateIds.length > 0) {
        try {
            await markIbansAsReported(duplicateIds);
            console.log(`Marked ${duplicateIds.length} duplicate IBAN(s) as reported`);
        } catch (err) {
            console.error('Error marking duplicate IBANs as reported:', err && err.message ? err.message : err);
            // continue — still return deduped rows
        }
    }

    return keep;
}

module.exports = getUnreportedIBANs;
