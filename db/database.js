// db/database.js
// Handles SQLite connection and logic for storing WhatsApp message properties

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const FPG_logs = require('./schema/FPG_logs');
const IBAN = require('./schema/IBAN');
const national_id = require('./schema/national_id');
const phone = require('./schema/phone');
const sadad = require('./schema/sadad');
const OCR_content = require('./schema/OCR_content');

const db_path = path.join(__dirname, '../FPG.db');
const db = new sqlite3.Database(db_path);

// Enable WAL mode for concurrent reads and writes
db.run('PRAGMA journal_mode = WAL;', (err) => {
    if (err) console.error('Error enabling WAL mode:', err.message);
});

// Create tables if they don't exist
db.serialize(() => {
    db.run(FPG_logs, (err) => {
        if (err) console.error('Error creating FPG_logs table:', err.message);
    });
    db.run(IBAN, (err) => {
        if (err) console.error('Error creating IBAN table:', err.message);
    });
    db.run(national_id, (err) => {
        if (err) console.error('Error creating national_id table:', err.message);
    });
    db.run(phone, (err) => {
        if (err) console.error('Error creating phone table:', err.message);
    });
    db.run(sadad, (err) => {
        if (err) console.error('Error creating sadad table:', err.message);
    });
    db.run(OCR_content, (err) => {
        if (err) console.error('Error creating OCR_content table:', err.message);
    });
});

const insert_message = require('./utility/insert_message');

module.exports = {
    db,
    insert_message
};



