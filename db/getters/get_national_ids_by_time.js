const sqlite3 = require('sqlite3').verbose();      // load sqlite3 with verbose stack traces
const path = require('path');      // load path helper for building the db file path

function get_national_ids_by_time(start_time, end_time) {      // fetch national_id rows created within a time window
  const db = new sqlite3.Database(path.join(__dirname, '../../FPG.db'));      // open the FPG SQLite database
db.run('PRAGMA busy_timeout = 5000');      // wait up to 5s on a locked db instead of failing
  const query = `
    SELECT id, FPG_logs_id, national_id_number, original_text, created_at, updated_at
    FROM national_id
    WHERE created_at >= ? AND created_at <= ?
    ORDER BY created_at ASC
  `;      // end the SQL query template literal

  return new Promise((resolve, reject) => {      // wrap the async db query in a promise
    db.all(query, [start_time, end_time], (err, rows) => {      // run the SELECT with the time-window bounds
      db.close();      // release the db handle
      err ? reject(err) : resolve(rows);      // reject on error, otherwise resolve with the rows
    });      // end the db.all callback
  });      // end the promise executor
}      // end the get_national_ids_by_time function

module.exports = get_national_ids_by_time;      // export the getter as the module's default
