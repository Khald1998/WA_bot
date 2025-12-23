// db/utility/get_unreported_phones.js
// Function to retrieve all phone records with is_reported=0

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./FPG.db');

function getUnreportedPhones() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT id, FPG_logs_id, phone_number, original_text, created_at, updated_at, is_reported
            FROM phone
            WHERE is_reported = 0
            ORDER BY created_at ASC
        `;
        
        db.all(query, [], (err, rows) => {
            if (err) {
                console.error('Error fetching unreported phones:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = getUnreportedPhones;
