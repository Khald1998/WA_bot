// crontab/collect_evidence_data.js
// This script is intended for scheduled data collection tasks.
// Add your data collection logic below.

console.log('Data collection script started.');

// TODO: Implement data collection logic here.

const get_all_FPG_logs = require('../db/utility/get_all_FPG_logs');
const update_fpg_log = require('../db/utility/update_FPG_log');
const parser_iban = require('../parser/parser_iban');
const parser_phone = require('../parser/parser_phone');
const parser_national_id = require('../parser/parser_national_id');

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');
const dbPath = path.join(__dirname, '../FPG.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE);


// Helper to process logs sequentially with delay
async function process_logs_sequentially(logs) {
    const results = [];
    // db is already created and tables ensured at top-level

    for (const log of logs) {
        const is_valid_type = log.type === 'chat' || 
            ((log.type === 'image' || log.type === 'video') && log.body);

        if (!is_valid_type) {
            await new Promise((resolve) => {
                update_fpg_log(log._serialized, { is_processed: true }, (err) => {
                    if (err) console.error(`Error updating log ${log._serialized}:`, err);
                    resolve();
                });
            });
            continue;
        }

        const iban_parsed = parser_iban(log.body);
        const phone_parsed = parser_phone(log.body);
        const national_id_parsed = parser_national_id(log.body);

        const has_evidence = iban_parsed.length > 0 || phone_parsed.length > 0 || national_id_parsed.length > 0;

        await new Promise((resolve) => {
            update_fpg_log(log._serialized, { 
                is_processed: true,
                is_valid_evidence: has_evidence ? 1 : 0
            }, (err) => {
                if (err) console.error(`Error updating log ${log._serialized}:`, err);
                resolve();
            });
        });

        // Insert IBANs
        for (const iban of iban_parsed) {
            db.run(
                `INSERT INTO IBAN (id, FPG_logs_id, iban_number, original_text, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    crypto.randomUUID(),
                    log._serialized,
                    iban,
                    log.body,
                    Date.now(),
                    Date.now()
                ],
                (err) => { if (err) console.error('IBAN insert error:', err); }
            );
        }
        // Insert phones
        for (const phone of phone_parsed) {
            db.run(
                `INSERT INTO phone (id, FPG_logs_id, phone_number, original_text, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    crypto.randomUUID(),
                    log._serialized,
                    phone,
                    log.body,
                    Date.now(),
                    Date.now()
                ],
                (err) => { if (err) console.error('Phone insert error:', err); }
            );
        }
        // Insert national IDs
        for (const nid of national_id_parsed) {
            db.run(
                `INSERT INTO national_id (id, FPG_logs_id, national_id_number, original_text, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    crypto.randomUUID(),
                    log._serialized,
                    nid,
                    log.body,
                    Date.now(),
                    Date.now()
                ],
                (err) => { if (err) console.error('National ID insert error:', err); }
            );
        }

        if (has_evidence) {
            results.push({
                mid: log.mid,
                iban: iban_parsed,
                phone: phone_parsed,
                national_id: national_id_parsed,
                log_body: log.body
            });
        }
    }
    db.close();
    return results;
}

try {
    get_all_FPG_logs((err, logs) => {
        if (err) {
            console.error('Error fetching FPG_logs:', err);
        } else {
            // First filter: get logs that are not processed (is_processed !== true)
            const unprocessed_logs = logs.filter(log => log.is_processed !== true);
            
            process_logs_sequentially(unprocessed_logs).then(results => {
                // console.log('Filtered Results:', results);
                console.log('Total unprocessed logs:', unprocessed_logs.length);
            });
        }
    });
} catch (e) {
    console.error('Unexpected error:', e);
}
