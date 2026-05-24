const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function get_national_ids_by_time(start_time, end_time) {
  const db = new sqlite3.Database(path.join(__dirname, '../FPG.db'));
  const query = `
    SELECT id, FPG_logs_id, national_id_number, original_text, created_at, updated_at
    FROM national_id
    WHERE created_at >= ? AND created_at <= ?
    ORDER BY created_at ASC
  `;

  return new Promise((resolve, reject) => {
    db.all(query, [start_time, end_time], (err, rows) => {
      db.close();
      err ? reject(err) : resolve(rows);
    });
  });
}

module.exports = get_national_ids_by_time;
