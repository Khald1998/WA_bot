const path = require('path');                                      // Node path helper for building the db file path
const { DatabaseSync } = require('node:sqlite');                   // Node's built-in synchronous SQLite driver — no native module, immune to the glibc constraint
const FPG_logs = require('./schema/FPG_logs');                     // load the FPG_logs table schema SQL
const IBAN = require('./schema/IBAN');                             // load the IBAN table schema SQL
const national_id = require('./schema/national_id');               // load the national_id table schema SQL
const phone = require('./schema/phone');                           // load the phone table schema SQL
const sadad = require('./schema/sadad');                           // load the sadad table schema SQL

const db = new DatabaseSync(path.join(__dirname, '../FPG.db'));    // open the ONE shared connection to FPG.db (imported by every db/ module)
db.exec('PRAGMA journal_mode = WAL');                              // enable WAL for concurrent readers + a writer
db.exec('PRAGMA busy_timeout = 5000');                             // wait up to 5s when the db is locked instead of erroring

for (const schema of [FPG_logs, IBAN, national_id, phone, sadad]) {  // create each table if it does not already exist
    try { db.exec(schema); } catch (err) { console.error('Error initializing schema:', err.message); }  // tolerate already-exists like the old driver did; never crash load
}                                                                 // end schema bootstrap

const bind = (v) => (v === undefined ? null : typeof v === 'boolean' ? (v ? 1 : 0) : v);  // node:sqlite rejects boolean/undefined binds; coerce them the way the old sqlite3 driver silently did

module.exports = { db, bind };                                    // export the shared connection and the bind coercion helper
