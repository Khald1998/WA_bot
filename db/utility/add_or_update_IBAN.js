// db/utility/add_or_update_IBAN.js
// Function to add or update IBAN records in the database

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '../../FPG.db'));

function add_or_update_iban({ id, FPG_logs_id, iban_number, original_text, created_at, updated_at }) {
    const query = `
        INSERT INTO IBAN (id, FPG_logs_id, iban_number, original_text, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            FPG_logs_id = excluded.FPG_logs_id,
            iban_number = excluded.iban_number,
            original_text = excluded.original_text,
            updated_at = excluded.updated_at;
    `;

    return new Promise((resolve, reject) => {
        db.run(query, [id, FPG_logs_id, iban_number, original_text, created_at, updated_at], function (err) {
            if (err) {
                console.error('Error adding/updating IBAN:', err.message);
                return reject(err);
            }
            console.log('IBAN record added/updated successfully');
            resolve();
        });
    });
}

module.exports = add_or_update_iban;