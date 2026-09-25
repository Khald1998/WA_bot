const { db } = require('../database');  // shared node:sqlite connection

const COLUMN = {  // whitelist of allowed validity columns — guards against SQL injection via a column name
    iban: 'is_valid_iban',  // IBAN validity flag column
    phone: 'is_valid_phone',  // phone validity flag column
    national_id: 'is_valid_national_id',  // national-id validity flag column
    sadad: 'is_valid_sadad',  // SADAD validity flag column
};  // end column whitelist

function update_log_validity(kind, is_valid, serialized) {  // set one is_valid_* flag on the FPG_logs row keyed by _serialized
    const column = COLUMN[kind];  // resolve the whitelisted column for this kind
    if (!column) throw new Error('update_log_validity: unknown kind ' + kind);  // throw on an unknown kind rather than building unsafe SQL
    db.prepare(`UPDATE FPG_logs SET ${column} = ? WHERE _serialized = ?`).run(is_valid, serialized);  // set the validity flag on the matching log row synchronously
}  // end update_log_validity

module.exports = update_log_validity;  // export the helper
