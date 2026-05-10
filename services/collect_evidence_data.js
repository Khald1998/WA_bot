const get_all_FPG_logs = require('../getters/get_all_FPG_logs');
const get_all_IBAN_log_ids = require('../getters/get_all_IBAN_log_ids');
const update_fpg_log = require('../db/utility/update_FPG_log');
const parser_iban = require('../parser/parser_iban');
const parser_phone = require('../parser/parser_phone');
const parser_national_id = require('../parser/parser_national_id');
const parser_sadad = require('../parser/parser_sadad');
const add_or_update_IBAN = require('../db/utility/add_or_update_IBAN');
const add_or_update_phone = require('../db/utility/add_or_update_phone');
const add_or_update_national_id = require('../db/utility/add_or_update_national_id');
const add_or_update_sadad = require('../db/utility/add_or_update_sadad');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');


function is_valid_for_processing(log) {
    if (log.type === 'chat') {
        return true;
    }
    // Media types (image/video) are only valid if they have caption text
    if ((log.type === 'image' || log.type === 'video') && log.body) {
        return true;
    }
    return false;
}


function extract_evidence(body) {
    return {
        ibans: parser_iban(body),
        phones: parser_phone(body),
        national_ids: parser_national_id(body),
        sadads: parser_sadad(body)
    };
}


function has_evidence(evidence) {
    return evidence.ibans.length > 0 ||
           evidence.phones.length > 0 ||
           evidence.national_ids.length > 0 ||
           evidence.sadads.length > 0;
}


function mark_as_processed(db, serialized_id, is_valid_evidence = false) {
    return new Promise((resolve, reject) => {
        const query = `UPDATE FPG_logs SET is_processed = ?, is_valid_evidence = ? WHERE _serialized = ?`;
        db.run(query, [1, is_valid_evidence ? 1 : 0, serialized_id], (err) => {
            if (err) {
                console.error(`Failed to update log ${serialized_id}:`, err);
                return reject(err);
            }
            resolve();
        });
    });
}


async function store_sadad(mid, sadads, log_body) {
    const timestamp = new Date(Date.now() + 3 * 3600 * 1000).toISOString().replace('Z', '+03:00');
    await Promise.all(sadads.map(({ sadad_number, sadad_type }) => {
        const id = crypto.createHash('sha256').update(mid + ':' + sadad_number).digest('hex');
        return add_or_update_sadad({
            id,
            FPG_logs_id: mid,
            sadad_number,
            sadad_type,
            original_text: log_body,
            created_at: timestamp,
            updated_at: timestamp
        });
    }));
}


async function store_evidence(result) {
    const timestamp = new Date(Date.now() + 3 * 3600 * 1000).toISOString().replace('Z', '+03:00');
    const writes = [];

    // Store IBANs
    result.iban.forEach(iban => {
        const id = crypto.createHash('sha256').update(result.mid + ':' + iban).digest('hex');
        writes.push(add_or_update_IBAN({
            id,
            FPG_logs_id: result.mid,
            iban_number: iban,
            original_text: result.log_body,
            created_at: timestamp,
            updated_at: timestamp
        }));
    });

    // Store phone numbers
    result.phone.forEach(phone => {
        const id = crypto.createHash('sha256').update(result.mid + ':' + phone).digest('hex');
        writes.push(add_or_update_phone({
            id,
            FPG_logs_id: result.mid,
            phone_number: phone,
            original_text: result.log_body,
            created_at: timestamp,
            updated_at: timestamp
        }));
    });

    // Store national IDs
    result.national_id.forEach(national_id => {
        const id = crypto.createHash('sha256').update(result.mid + ':' + national_id).digest('hex');
        writes.push(add_or_update_national_id({
            id,
            FPG_logs_id: result.mid,
            national_id_number: national_id,
            original_text: result.log_body,
            created_at: timestamp,
            updated_at: timestamp
        }));
    });

    await Promise.all(writes);

    // Store SADADs only if no IBAN was found in this log
    if (result.iban.length === 0 && result.sadad.length > 0) {
        await store_sadad(result.mid, result.sadad, result.log_body);
    }
}


async function process_log(db, log) {
    // Skip logs that aren't valid for processing
    if (!is_valid_for_processing(log)) {
        await mark_as_processed(db, log._serialized, false);
        return null;
    }
    // Extract all evidence types from the message body
    const evidence = extract_evidence(log.body);
    const found_evidence = has_evidence(evidence);
    const result = found_evidence ? {
        mid: log.mid,
        iban: evidence.ibans,
        phone: evidence.phones,
        national_id: evidence.national_ids,
        sadad: evidence.sadads,
        log_body: log.body
    } : null;
    // Persist evidence BEFORE flipping is_processed so a crash between the two
    // can't leave the log marked done with no evidence rows.
    if (result) {
        await store_evidence(result);
    }
    await mark_as_processed(db, log._serialized, found_evidence);
    return result;
}


function open_db(db_path) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(db_path, sqlite3.OPEN_READWRITE, (err) => {
            if (err) return reject(err);
            resolve(db);
        });
    });
}


function close_db(db) {
    return new Promise((resolve) => {
        db.close(() => resolve());
    });
}


function fetch_all_fpg_logs() {
    return new Promise((resolve, reject) => {
        get_all_FPG_logs((err, logs) => {
            if (err) return reject(err);
            resolve(logs);
        });
    });
}


async function collect_evidence_data() {
    const db_path = path.join(__dirname, '../FPG.db');
    let db;
    try {
        db = await open_db(db_path);
    } catch (err) {
        console.error('Error opening database:', err);
        throw err;
    }

    try {
        const iban_log_ids = await get_all_IBAN_log_ids();
        const iban_log_id_set = new Set(iban_log_ids);

        const logs = await fetch_all_fpg_logs();
        const unprocessed_logs = logs.filter(log => !log.is_processed);
        const already_processed_logs = logs.filter(log => log.is_processed);

        console.log(`[${new Date().toISOString()}] Found ${unprocessed_logs.length} unprocessed logs to process`);

        // SADAD-only pass over logs that were already processed (no IBAN)
        async function run_sadad_pass_on_processed() {
            const tasks = [];
            already_processed_logs.forEach(log => {
                if (iban_log_id_set.has(log.mid) || !is_valid_for_processing(log)) return;
                const sadads = parser_sadad(log.body);
                if (sadads.length > 0) {
                    tasks.push(store_sadad(log.mid, sadads, log.body));
                }
            });
            await Promise.all(tasks);
            if (tasks.length > 0) {
                console.log(`[${new Date().toISOString()}] SADAD found in ${tasks.length} already-processed logs.`);
            }
        }

        if (unprocessed_logs.length === 0) {
            await run_sadad_pass_on_processed();
            console.log(`[${new Date().toISOString()}] Processing complete. No new logs to process.`);
            return { processed: 0, evidence_count: 0 };
        }

        const evidence_results = [];
        const settled = await Promise.allSettled(
            unprocessed_logs.map(log => process_log(db, log).then(result => {
                if (result) {
                    evidence_results.push(result);
                    // Track newly found IBAN logs so SADAD pass skips them
                    if (result.iban.length > 0) {
                        iban_log_id_set.add(log.mid);
                    }
                }
                return result;
            }))
        );

        settled.forEach((outcome, i) => {
            if (outcome.status === 'rejected') {
                console.error(`Error processing log ${unprocessed_logs[i]._serialized}:`, outcome.reason);
            }
        });

        await run_sadad_pass_on_processed();

        console.log(`[${new Date().toISOString()}] Processing complete. Found ${evidence_results.length} logs with evidence.`);
        if (evidence_results.length > 0) {
            console.log('Evidence stored in respective tables.');
        }

        return { processed: unprocessed_logs.length, evidence_count: evidence_results.length };
    } finally {
        await close_db(db);
    }
}


module.exports = {
    collect_evidence_data
};
