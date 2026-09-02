// Reply-based SADAD code linking.
//
// A code-less bill message is skipped (never stored). When someone later REPLIES
// to that bill message with a message that carries the biller code, this creates
// the bill — number from the quoted (bill) message, code from the reply — and
// stores + reports it through the normal handle_sadad path.
//
// quoted_serialized = FPG_logs._serialized of the message that was replied to
// (captured as quoted_msg_id on the reply).

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const parser_sadad = require('../parser/parser_sadad');
const handle_sadad = require('../handler/handle_sadad');
const { log_action } = require('../debug/logger');

const db = new sqlite3.Database(path.join(__dirname, '../FPG.db'));
db.run('PRAGMA busy_timeout = 5000');

const get = (sql, params) => new Promise((res, rej) =>
    db.get(sql, params, (err, row) => err ? rej(err) : res(row)));

async function link_quoted_sadad_code(quoted_serialized, code) {
    if (!quoted_serialized || !code) return;
    try {
        // The bill number lives in the message that was replied to.
        const quoted = await get('SELECT mid, _serialized, body FROM FPG_logs WHERE _serialized = ?', [quoted_serialized]);
        if (!quoted || !quoted.body) return;

        const bills = [...new Set(parser_sadad(quoted.body, true).map(b => b.sadad_number))]
            .filter(n => n && n !== 'ALERT');
        if (bills.length === 0) return;

        const sadads = bills.map(n => ({ sadad_number: n, sadad_type: code }));
        log_action('SADAD_CODE_LINKED_FROM_REPLY', `code: ${code}, bills: ${bills.join(',')}`);

        // Store + report via the normal path (dedup upsert keeps the code).
        await handle_sadad(sadads, quoted.body, quoted.mid, quoted._serialized);
    } catch (err) {
        log_action('SADAD_CODE_LINK_ERROR', err.message);
    }
}

module.exports = link_quoted_sadad_code;
