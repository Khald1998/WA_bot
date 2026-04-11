const get_all_FPG_logs = require('./getters/get_all_FPG_logs');
const get_all_IBAN_log_ids = require('./getters/get_all_IBAN_log_ids');
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


function mark_as_processed(db, serialized_id, is_valid_evidence = false, callback) {
    const query = `UPDATE FPG_logs SET is_processed = ?, is_valid_evidence = ? WHERE _serialized = ?`;
    db.run(query, [true, is_valid_evidence ? 1 : 0, serialized_id], (err) => {
        if (err) {
            console.error(`Failed to update log ${serialized_id}:`, err);
        }
        if (callback) callback(err);
    });
}


function process_log(db, log, callback) {
    // Skip logs that aren't valid for processing
    if (!is_valid_for_processing(log)) {
        mark_as_processed(db, log._serialized, false, callback);
        return;
    }
    // Extract all evidence types from the message body
    const evidence = extract_evidence(log.body);
    const found_evidence = has_evidence(evidence);
    // Update the log status in database
    mark_as_processed(db, log._serialized, found_evidence, (err) => {
        if (err) {
            if (callback) callback(err);
            return;
        }
        if (found_evidence) {
            callback(null, {
                mid: log.mid,
                iban: evidence.ibans,
                phone: evidence.phones,
                national_id: evidence.national_ids,
                sadad: evidence.sadads,
                log_body: log.body
            });
        } else {
            callback(null, null);
        }
    });
}


function store_sadad(mid, sadads, log_body) {
    const timestamp = new Date().toISOString();
    sadads.forEach(({ sadad_number, sadad_type }) => {
        const id = crypto.createHash('sha256').update(mid + ':' + sadad_number).digest('hex');
        add_or_update_sadad({
            id,
            FPG_logs_id: mid,
            sadad_number,
            sadad_type,
            original_text: log_body,
            created_at: timestamp,
            updated_at: timestamp
        });
    });
}


function store_evidence(result) {
    const timestamp = new Date().toISOString();

    // Store IBANs
    result.iban.forEach(iban => {
        const id = crypto.createHash('sha256').update(result.mid + ':' + iban).digest('hex');
        add_or_update_IBAN({
            id,
            FPG_logs_id: result.mid,
            iban_number: iban,
            original_text: result.log_body,
            created_at: timestamp,
            updated_at: timestamp
        });
    });

    // Store phone numbers
    result.phone.forEach(phone => {
        const id = crypto.createHash('sha256').update(result.mid + ':' + phone).digest('hex');
        add_or_update_phone({
            id,
            FPG_logs_id: result.mid,
            phone_number: phone,
            original_text: result.log_body,
            created_at: timestamp,
            updated_at: timestamp
        });
    });

    // Store national IDs
    result.national_id.forEach(national_id => {
        const id = crypto.createHash('sha256').update(result.mid + ':' + national_id).digest('hex');
        add_or_update_national_id({
            id,
            FPG_logs_id: result.mid,
            national_id_number: national_id,
            original_text: result.log_body,
            created_at: timestamp,
            updated_at: timestamp
        });
    });

    // Store SADADs only if no IBAN was found in this log
    if (result.iban.length === 0 && result.sadad.length > 0) {
        store_sadad(result.mid, result.sadad, result.log_body);
    }
}


function collect_evidence_data() {
    const db_path = path.join(__dirname, '../FPG.db');
    const db = new sqlite3.Database(db_path, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.error('Error opening database:', err);
            return;
        }
    });

    // Fetch pre-existing IBAN log IDs so SADAD skips those logs
    get_all_IBAN_log_ids().then(iban_log_ids => {
        const iban_log_id_set = new Set(iban_log_ids);

        get_all_FPG_logs((err, logs) => {
            if (err) {
                console.error('Error fetching FPG logs:', err);
                db.close();
                return;
            }

            const unprocessed_logs = logs.filter(log => !log.is_processed);
            const already_processed_logs = logs.filter(log => log.is_processed);

            console.log(`[${new Date().toISOString()}] Found ${unprocessed_logs.length} unprocessed logs to process`);

            // SADAD-only pass over logs that were already processed (no IBAN)
            function run_sadad_pass_on_processed() {
                let sadad_count = 0;
                already_processed_logs.forEach(log => {
                    if (iban_log_id_set.has(log.mid) || !is_valid_for_processing(log)) return;
                    const sadads = parser_sadad(log.body);
                    if (sadads.length > 0) {
                        store_sadad(log.mid, sadads, log.body);
                        sadad_count++;
                    }
                });
                if (sadad_count > 0) {
                    console.log(`[${new Date().toISOString()}] SADAD found in ${sadad_count} already-processed logs.`);
                }
            }

            const evidence_results = [];

            if (unprocessed_logs.length === 0) {
                run_sadad_pass_on_processed();
                console.log(`[${new Date().toISOString()}] Processing complete. No new logs to process.`);
                db.close();
                return;
            }

            let processed_count = 0;
            db.serialize(() => {
                unprocessed_logs.forEach(log => {
                    process_log(db, log, (err, result) => {
                        processed_count++;

                        if (err) {
                            console.error(`Error processing log ${log._serialized}:`, err);
                        } else if (result) {
                            evidence_results.push(result);
                            store_evidence(result);
                            // Track newly found IBAN logs so SADAD pass skips them
                            if (result.iban.length > 0) {
                                iban_log_id_set.add(log.mid);
                            }
                        }

                        if (processed_count === unprocessed_logs.length) {
                            run_sadad_pass_on_processed();
                            console.log(`[${new Date().toISOString()}] Processing complete. Found ${evidence_results.length} logs with evidence.`);
                            if (evidence_results.length > 0) {
                                console.log('Evidence stored in respective tables.');
                            }
                            db.close();
                        }
                    });
                });
            });
        });
    }).catch(err => {
        console.error('Error fetching IBAN log IDs:', err);
        db.close();
    });
}


module.exports = {
    collect_evidence_data
};
