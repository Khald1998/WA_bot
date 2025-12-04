// db/database.js
// Handles SQLite connection and logic for storing WhatsApp message properties

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const FPG_logs = require('./schema/FPG_logs');

const dbPath = path.join(__dirname, '../FPG.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(FPG_logs);
});

const insert_message = require('./utility/insert_message');

module.exports = {
    db,
    insert_message
};
