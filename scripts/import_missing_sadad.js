// One-off backfill: import SADAD bills from the master xlsx report
// (قائمة فواتير السداد 589) that are missing from the DB.
//
// - id = sha256('sadad:' + number)  (same dedup key as the live pipeline)
// - sadad_type = the biller code straight from the xlsx (authoritative)
// - is_reported = 1  → does NOT trigger a per-message blast; still included in
//   the nightly 23:59 CSV export to the bank (that query ignores is_reported).
// - ON CONFLICT(id) DO NOTHING → never touches existing rows.
// Reversible: DELETE FROM sadad WHERE FPG_logs_id='XLSX589_IMPORT';
const fs = require('fs');  // filesystem access for reading the JSON
const crypto = require('crypto');  // hashing for the dedup id
const sqlite3 = require('sqlite3').verbose();  // sqlite driver in verbose mode

const JSON_PATH = '/tmp/claude-1000/-root-whatsapp-bot/c4cde5c5-cd8b-4f29-b512-b46468b25b63/scratchpad/missing_bills.json';  // path to the extracted missing-bills JSON
const TS = '2026-09-04T12:00:00.000+03:00';  // fixed created/updated timestamp for imports

const bills = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));  // load the missing bills list
const d = new sqlite3.Database('/root/whatsapp-bot/FPG.db');  // open the production DB
const run = (q, p = []) => new Promise((r, j) => d.run(q, p, function (e) { e ? j(e) : r(this); }));  // promisified run returning the statement
const get = (q, p = []) => new Promise((r, j) => d.get(q, p, (e, x) => e ? j(e) : r(x)));  // promisified single-row get

(async () => {  // start the async import IIFE
  await run('PRAGMA busy_timeout=10000');  // wait up to 10s on a locked DB
  const before = (await get('SELECT COUNT(*) n FROM sadad')).n;  // count rows before import
  await run('BEGIN');  // open a transaction
  let ins = 0;  // running count of inserted rows
  for (const b of bills) {  // loop over each missing bill
    const id = crypto.createHash('sha256').update('sadad:' + b.num).digest('hex');  // derive the dedup id from the bill number
    const r = await run(  // run the insert statement
      `INSERT INTO sadad (id,FPG_logs_id,sadad_number,sadad_type,original_text,created_at,updated_at,is_reported)
       VALUES (?,?,?,?,?,?,?,1) ON CONFLICT(id) DO NOTHING`,
      [id, 'XLSX589_IMPORT', b.num, b.code, 'backfill: master xlsx 589-list (imported 2026-09-05)', TS, TS]  // bind values for the insert
    );  // end the run call
    ins += r.changes;  // add rows changed to the counter
  }  // end bills loop
  await run('COMMIT');  // commit the transaction
  const after = (await get('SELECT COUNT(*) n FROM sadad')).n;  // count rows after import
  const tagged = (await get("SELECT COUNT(*) n FROM sadad WHERE FPG_logs_id='XLSX589_IMPORT'")).n;  // count import-tagged rows
  const distinct = (await get('SELECT COUNT(DISTINCT sadad_number) n FROM sadad')).n;  // count distinct bill numbers
  console.log(`rows before: ${before} | inserted: ${ins} | rows after: ${after} | distinct: ${distinct} | import-tagged: ${tagged}`);  // print the import summary
  d.close();  // close the DB handle
})().catch(e => { console.error('ERR', e.message); d.close(); process.exit(1); });  // run the IIFE and handle errors
