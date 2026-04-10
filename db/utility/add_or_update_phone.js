// db/utility/add_or_update_phone.js
// Function to add or update phone records in the database

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./FPG.db');

function add_or_update_phone({ id, FPG_logs_id, phone_number, original_text, created_at, updated_at }) {
    const query = `
        INSERT INTO phone (id, FPG_logs_id, phone_number, original_text, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            FPG_logs_id = excluded.FPG_logs_id,
            phone_number = excluded.phone_number,
            original_text = excluded.original_text,
            updated_at = excluded.updated_at;
    `;

    db.run(query, [id, FPG_logs_id, phone_number, original_text, created_at, updated_at], function (err) {
        if (err) {
            console.error('Error adding/updating phone:', err.message);
        } else {
            console.log('Phone record added/updated successfully');
        }
    });
}

module.exports = add_or_update_phone;