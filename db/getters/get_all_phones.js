const { db } = require('../database');                             // shared node:sqlite connection
const query = `
    SELECT phone_number
    FROM phone
    ORDER BY created_at ASC
`;                                                                 // SQL selecting phone numbers oldest-first
function get_all_phones() {                                        // fetch every stored phone number from the DB
  const rows = db.prepare(query).all();                            // run the SELECT with no bound params, synchronously
  return rows.map((r) => r.phone_number);                          // return just the list of phone-number strings
}                                                                  // end get_all_phones

module.exports = get_all_phones;                                   // export the getter as the module's default
