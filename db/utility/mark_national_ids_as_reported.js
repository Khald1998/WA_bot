// db/utility/mark_national_ids_as_reported.js
// Function to mark national_id records as reported (is_reported=1)

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./FPG.db');

function mark_national_ids_as_reported(national_id_ids) {
    return new Promise((resolve, reject) => {
        if (!national_id_ids || national_id_ids.length === 0) {
            resolve({ changes: 0 });
            return;
        }

        const placeholders = national_id_ids.map(() => '?').join(',');
        const query = `
            UPDATE national_id
            SET is_reported = 1, updated_at = datetime('now', '+3 hours')
            WHERE id IN (${placeholders})
        `;
        
        db.run(query, national_id_ids, function(err) {
            if (err) {
                console.error('Error marking national IDs as reported:', err.message);
                reject(err);
            } else {
                resolve({ changes: this.changes });
            }
        });
    });
}

module.exports = mark_national_ids_as_reported;
