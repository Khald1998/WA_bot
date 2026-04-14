// db/utility/mark_sadads_as_reported.js
// Function to mark SADAD records as reported (is_reported=1)

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./FPG.db');

function mark_sadads_as_reported(sadad_ids) {
    return new Promise((resolve, reject) => {
        if (!sadad_ids || sadad_ids.length === 0) {
            resolve({ changes: 0 });
            return;
        }

        const placeholders = sadad_ids.map(() => '?').join(',');
        const query = `
            UPDATE sadad
            SET is_reported = 1, updated_at = datetime('now', '+3 hours')
            WHERE id IN (${placeholders})
        `;
        
        db.run(query, sadad_ids, function(err) {
            if (err) {
                console.error('Error marking SADADs as reported:', err.message);
                reject(err);
            } else {
                resolve({ changes: this.changes });
            }
        });
    });
}

module.exports = mark_sadads_as_reported;
