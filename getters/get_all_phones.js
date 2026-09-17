const sqlite3 = require('sqlite3').verbose();  // load sqlite3 in verbose mode for better stack traces
const path = require('path');  // load Node's path module for building the DB path

function get_all_phones() {  // fetch every stored phone number from the DB
  const db = new sqlite3.Database(path.join(__dirname, '../FPG.db'));  // open the FPG SQLite database
db.run('PRAGMA busy_timeout = 5000');  // wait up to 5s if the DB is locked instead of failing
  const query = `
    SELECT phone_number
    FROM phone
    ORDER BY created_at ASC
  `;  // SQL selecting phone numbers oldest-first

  return new Promise((resolve, reject) => {  // wrap the async query in a promise
    db.all(query, [], (err, rows) => {  // run the SELECT with no bound params
      db.close();  // release the DB handle once the query returns
      err ? reject(err) : resolve(rows.map((r) => r.phone_number));  // reject on error, else resolve with the list of numbers
    });  // end db.all callback
  });  // end promise executor
}  // end get_all_phones

module.exports = get_all_phones;  // export the getter as the module's default
