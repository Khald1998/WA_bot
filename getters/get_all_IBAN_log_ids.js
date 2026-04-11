// db/utility/get_all_IBAN_log_ids.js
// Returns all distinct FPG_logs_id values from the IBAN table

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./FPG.db');

function get_all_IBAN_log_ids() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT DISTINCT FPG_logs_id
            FROM IBAN
            ORDER BY FPG_logs_id ASC
        `;

        db.all(query, [], (err, rows) => {
            if (err) {
                console.error('Error fetching IBAN log IDs:', err.message);
                reject(err);
            } else {
                resolve(rows.map(row => row.FPG_logs_id));
            }
        });
    });
}

module.exports = get_all_IBAN_log_ids;
