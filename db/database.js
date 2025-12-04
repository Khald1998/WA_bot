// db/database.js
// Handles SQLite connection and logic for storing WhatsApp message properties

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const FPG_logs = require('./schema/FPG_logs');
const IBAN = require('./schema/IBAN');
const national_id = require('./schema/national_id');
const phone = require('./schema/phone');

const dbPath = path.join(__dirname, '../FPG.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(FPG_logs);
    db.run(IBAN);
    db.run(national_id);
    db.run(phone);
});

const insert_message = require('./utility/insert_message');

module.exports = {
    db,
    insert_message
};



