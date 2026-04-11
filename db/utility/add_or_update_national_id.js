// db/utility/add_or_update_national_id.js
// Function to add or update National ID records in the database

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./FPG.db');

function add_or_update_national_id({ id, FPG_logs_id, national_id_number, original_text, created_at, updated_at }) {
    const query = `
        INSERT INTO national_id (id, FPG_logs_id, national_id_number, original_text, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            FPG_logs_id = excluded.FPG_logs_id,
            national_id_number = excluded.national_id_number,
            original_text = excluded.original_text,
            updated_at = excluded.updated_at;
    `;

    return new Promise((resolve, reject) => {
        db.run(query, [id, FPG_logs_id, national_id_number, original_text, created_at, updated_at], function (err) {
            if (err) {
                console.error('Error adding/updating National ID:', err.message);
                return reject(err);
            }
            console.log('National ID record added/updated successfully');
            resolve();
        });
    });
}

module.exports = add_or_update_national_id;