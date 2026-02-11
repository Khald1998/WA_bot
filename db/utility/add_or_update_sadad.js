// db/utility/add_or_update_sadad.js
// Function to add or update SADAD records in the database

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./FPG.db');

function addOrUpdateSadad({ id, FPG_logs_id, sadad_number, original_text, created_at, updated_at }) {
    const query = `
        INSERT INTO sadad (id, FPG_logs_id, sadad_number, original_text, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            FPG_logs_id = excluded.FPG_logs_id,
            sadad_number = excluded.sadad_number,
            original_text = excluded.original_text,
            updated_at = excluded.updated_at;
    `;

    db.run(query, [id, FPG_logs_id, sadad_number, original_text, created_at, updated_at], function (err) {
        if (err) {
            console.error('Error adding/updating SADAD:', err.message);
        } else {
            console.log('SADAD record added/updated successfully');
        }
    });
}

module.exports = addOrUpdateSadad;
