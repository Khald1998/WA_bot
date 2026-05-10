// db/utility/mark_ibans_as_reported.js
// Function to mark IBAN records as reported (is_reported=1)

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./FPG.db');

function mark_ibans_as_reported(iban_ids) {
    return new Promise((resolve, reject) => {
        if (!iban_ids || iban_ids.length === 0) {
            resolve({ changes: 0 });
            return;
        }

        const placeholders = iban_ids.map(() => '?').join(',');
        const updated_at = new Date(Date.now() + 3 * 3600 * 1000).toISOString().replace('Z', '+03:00');
        const query = `
            UPDATE IBAN
            SET is_reported = 1, updated_at = ?
            WHERE id IN (${placeholders})
        `;

        db.run(query, [updated_at, ...iban_ids], function(err) {
            if (err) {
                console.error('Error marking IBANs as reported:', err.message);
                reject(err);
            } else {
                resolve({ changes: this.changes });
            }
        });
    });
}

module.exports = mark_ibans_as_reported;
