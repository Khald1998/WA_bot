const { db } = require('../database');                             // shared node:sqlite connection
const query = 'SELECT mid, _serialized, body FROM FPG_logs WHERE _serialized = ?';  // the bill number lives in the message that was replied to; fetch the quoted bill message row
const get_message_by_serialized = (serialized) => db.prepare(query).get(serialized);  // run the single-row lookup and return the row synchronously (undefined when no match)

module.exports = get_message_by_serialized;                       // export the getter
