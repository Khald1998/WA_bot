// db/utility/get_unreported_sadads.js
// Function to retrieve all SADAD records with is_reported=0

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '../FPG.db'));

function get_unreported_sadads() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT id, FPG_logs_id, sadad_number, sadad_type, original_text, created_at, updated_at, is_reported
            FROM sadad
            WHERE is_reported = 0
            ORDER BY created_at ASC
        `;
        
        db.all(query, [], (err, rows) => {
            if (err) {
                console.error('Error fetching unreported SADADs:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = get_unreported_sadads;
