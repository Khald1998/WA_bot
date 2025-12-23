// db/utility/get_unreported_IBANs.js
// Function to retrieve all IBAN records with is_reported=0

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./FPG.db');

function getUnreportedIBANs() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT id, FPG_logs_id, iban_number, original_text, created_at, updated_at, is_reported
            FROM IBAN
            WHERE is_reported = 0
            ORDER BY created_at ASC
        `;
        
        db.all(query, [], (err, rows) => {
            if (err) {
                console.error('Error fetching unreported IBANs:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = getUnreportedIBANs;
