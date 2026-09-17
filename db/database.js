// db/database.js
// Handles SQLite connection and logic for storing WhatsApp message properties

const sqlite3 = require('sqlite3').verbose();                      // load sqlite3 driver in verbose mode
const path = require('path');                                      // load Node's path module
const FPG_logs = require('./schema/FPG_logs');                     // load the FPG_logs table schema SQL
const IBAN = require('./schema/IBAN');                             // load the IBAN table schema SQL
const national_id = require('./schema/national_id');               // load the national_id table schema SQL
const phone = require('./schema/phone');                           // load the phone table schema SQL
const sadad = require('./schema/sadad');                           // load the sadad table schema SQL

const db_path = path.join(__dirname, '../FPG.db');                 // resolve the absolute path to FPG.db
const db = new sqlite3.Database(db_path);                          // open the SQLite database connection

// Enable WAL mode for concurrent reads and writes
db.run('PRAGMA journal_mode = WAL;', (err) => {                    // switch the database into WAL journal mode
    if (err) console.error('Error enabling WAL mode:', err.message);  // log any failure enabling WAL
});                                                                // end the WAL PRAGMA callback
db.run('PRAGMA busy_timeout = 5000');                             // wait up to 5s when the db is locked

// Create tables if they don't exist
db.serialize(() => {                                               // run the table creations sequentially
    db.run(FPG_logs, (err) => {                                    // create the FPG_logs table
        if (err) console.error('Error creating FPG_logs table:', err.message);  // log any FPG_logs creation error
    });                                                            // end the FPG_logs creation callback
    db.run(IBAN, (err) => {                                        // create the IBAN table
        if (err) console.error('Error creating IBAN table:', err.message);  // log any IBAN creation error
    });                                                            // end the IBAN creation callback
    db.run(national_id, (err) => {                                 // create the national_id table
        if (err) console.error('Error creating national_id table:', err.message);  // log any national_id creation error
    });                                                            // end the national_id creation callback
    db.run(phone, (err) => {                                       // create the phone table
        if (err) console.error('Error creating phone table:', err.message);  // log any phone creation error
    });                                                            // end the phone creation callback
    db.run(sadad, (err) => {                                       // create the sadad table
        if (err) console.error('Error creating sadad table:', err.message);  // log any sadad creation error
    });                                                            // end the sadad creation callback
});                                                                // end the serialized table setup



