const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const db_path = path.join(__dirname, '../../FPG.db');

function open_database() {
  return new sqlite3.Database(db_path);
}

module.exports = open_database;
