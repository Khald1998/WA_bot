// Reply-based SADAD code linking.
//
// A code-less bill message is skipped (never stored). When someone later REPLIES
// to that bill message with a message that carries the biller code, this creates
// the bill — number from the quoted (bill) message, code from the reply — and
// stores + reports it through the normal handle_sadad path.
//
// quoted_serialized = FPG_logs._serialized of the message that was replied to
// (captured as quoted_msg_id on the reply).

const sqlite3 = require('sqlite3').verbose();                      // load sqlite3 driver in verbose mode
const path = require('path');                                      // load Node's path module
const parser_sadad = require('../parser/parser_sadad');            // load the SADAD text parser
const handle_sadad = require('../handler/handle_sadad');           // load the SADAD store/report handler
const { log_action } = require('../debug/logger');                 // pull in the action logger helper

const db = new sqlite3.Database(path.join(__dirname, '../FPG.db'));  // open the FPG.db SQLite database
db.run('PRAGMA busy_timeout = 5000');                             // wait up to 5s when the db is locked

const get = (sql, params) => new Promise((res, rej) =>             // promisify a single-row db.get query
    db.get(sql, params, (err, row) => err ? rej(err) : res(row)));  // run the query, reject on error else resolve the row

async function link_quoted_sadad_code(quoted_serialized, code) {   // link a replied-to bill with a code from the reply
    if (!quoted_serialized || !code) return;                       // bail out if either argument is missing
    try {                                                          // guard the linking against errors
        // The bill number lives in the message that was replied to.
        const quoted = await get('SELECT mid, _serialized, body FROM FPG_logs WHERE _serialized = ?', [quoted_serialized]);  // fetch the quoted bill message row
        if (!quoted || !quoted.body) return;                       // bail if the quoted message or its body is missing

        const bills = [...new Set(parser_sadad(quoted.body, true).map(b => b.sadad_number))]  // parse and dedupe bill numbers from the quoted body
            .filter(n => n);                                       // drop empty values
        if (bills.length === 0) return;                            // bail if no usable bill numbers remain

        const sadads = bills.map(n => ({ sadad_number: n, sadad_type: code }));  // pair each bill number with the reply's code
        log_action('SADAD_CODE_LINKED_FROM_REPLY', `code: ${code}, bills: ${bills.join(',')}`);  // log the code-to-bills linkage

        // Store + report via the normal path (dedup upsert keeps the code).
        await handle_sadad(sadads, quoted.body, quoted.mid, quoted._serialized);  // store and report the completed bills
    } catch (err) {                                                // catch any error during linking
        log_action('SADAD_CODE_LINK_ERROR', err.message);          // log the linking error
    }                                                              // end the try/catch block
}                                                                  // end link_quoted_sadad_code

module.exports = link_quoted_sadad_code;                           // export the linking function
