

const get_all_FPG_logs = require('../db/utility/get_all_FPG_logs');
const update_fpg_log = require('../db/utility/update_FPG_log');
const parser_iban = require('../parser/parser_iban');
const parser_phone = require('../parser/parser_phone');
const parser_national_id = require('../parser/parser_national_id');
const add_or_update_IBAN = require('../db/utility/add_or_update_IBAN');
const add_or_update_phone = require('../db/utility/add_or_update_phone');
const add_or_update_national_id = require('../db/utility/add_or_update_national_id');
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
        national_ids: parser_national_id(body)
    };
}


function has_evidence(evidence) {
    return evidence.ibans.length > 0 || 
           evidence.phones.length > 0 || 
           evidence.national_ids.length > 0;
}


function mark_as_processed(db, serialized_id, is_valid_evidence = false, callback) {
    const update_data = {
        is_processed: true,
        is_valid_evidence: is_valid_evidence ? 1 : 0
    };
    
    const query = `UPDATE FPG_logs SET is_processed = ?, is_valid_evidence = ? WHERE _serialized = ?`;
    db.run(query, [update_data.is_processed, update_data.is_valid_evidence, serialized_id], (err) => {
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
    // Extract evidence from the message body
    const evidence = extract_evidence(log.body);
    const found_evidence = has_evidence(evidence);
    // Update the log status in database
    mark_as_processed(db, log._serialized, found_evidence, (err) => {
        if (err) {
            if (callback) callback(err);
            return;
        }
        // Return formatted result if evidence was found
        if (found_evidence) {
            const result = {
                mid: log.mid,
                iban: evidence.ibans,
                phone: evidence.phones,
                national_id: evidence.national_ids,
                log_body: log.body
            };
            if (callback) callback(null, result);
        } else {
            if (callback) callback(null, null);
        }
    });
}


function store_evidence(result) {
    const timestamp = new Date().toISOString();
    
    // Store IBANs
    result.iban.forEach(iban => {
        const id = crypto.createHash('sha256').update(result.mid + ':' + iban).digest('hex');
        add_or_update_IBAN({
            id: id,
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
            id: id,
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
            id: id,
            FPG_logs_id: result.mid,
            national_id_number: national_id,
            original_text: result.log_body,
            created_at: timestamp,
            updated_at: timestamp
        });
    });
}


function collect_evidence_data() {
    const dbPath = path.join(__dirname, '../FPG.db');
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.error('Error opening database:', err);
            return;
        }
    });

    get_all_FPG_logs((err, logs) => {
        if (err) {
            console.error('Error fetching FPG logs:', err);
            db.close();
            return;
        }
        // Filter to only unprocessed logs (is_processed is 0, false, or null/undefined)
        const unprocessed_logs = logs.filter(log => !log.is_processed);
        console.log(`[${new Date().toISOString()}] Found ${unprocessed_logs.length} unprocessed logs to process`);
        
        // Process each log sequentially using db.serialize to avoid SQLITE_BUSY
        const evidence_results = [];
        let processed_count = 0;
        
        db.serialize(() => {
            unprocessed_logs.forEach((log, index) => {
                process_log(db, log, (err, result) => {
                    processed_count++;
                    
                    if (err) {
                        console.error(`Error processing log ${log._serialized}:`, err);
                    } else if (result) {
                        evidence_results.push(result);
                        store_evidence(result);
                    }
                    
                    // After processing all logs, display summary and close db
                    if (processed_count === unprocessed_logs.length) {
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
}

// To run the collection process once, uncomment below:
// collect_evidence_data();

module.exports = {
    collect_evidence_data
};