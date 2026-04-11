// db/utility/get_unreported_national_ids.js
// Function to retrieve all national_id records with is_reported=0

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./FPG.db');

function get_unreported_national_ids() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT id, FPG_logs_id, national_id_number, original_text, created_at, updated_at, is_reported
            FROM national_id
            WHERE is_reported = 0
            ORDER BY created_at ASC
        `;
        
        db.all(query, [], (err, rows) => {
            if (err) {
                console.error('Error fetching unreported national IDs:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = get_unreported_national_ids;
