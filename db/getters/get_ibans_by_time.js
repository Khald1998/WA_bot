const sqlite3 = require('sqlite3').verbose();  // sqlite3 driver in verbose mode
const path = require('path');  // Node path helpers for building the db path

function get_ibans_by_time(start_time, end_time) {  // fetch IBAN rows created within a time window
  const db = new sqlite3.Database(path.join(__dirname, '../../FPG.db'));  // open a connection to the FPG database
db.run('PRAGMA busy_timeout = 5000');  // wait up to 5s on a locked db before erroring
  const query = `
    SELECT id, FPG_logs_id, iban_number, original_text, created_at, updated_at
    FROM IBAN
    WHERE created_at >= ? AND created_at <= ?
    ORDER BY created_at ASC
  `;  // end the SELECT query text

  return new Promise((resolve, reject) => {  // wrap the async query in a promise
    db.all(query, [start_time, end_time], (err, rows) => {  // run the SELECT over the time range
      db.close();  // release the db handle
      err ? reject(err) : resolve(rows);  // reject on error, else resolve with the rows
    });  // end db.all callback
  });  // end promise executor
}  // end get_ibans_by_time function

module.exports = get_ibans_by_time;  // export the getter
