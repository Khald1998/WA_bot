const get_all_FPG_logs = require('../db/utility/get_all_FPG_logs');
const get_all_IBAN_log_ids = require('../db/utility/get_all_IBAN_log_ids');
const parser_sadad = require('../parser/parser_sadad');
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
        sadads: parser_sadad(body)
    };
}


function has_evidence(evidence) {
    return evidence.sadads.length > 0;
}


function process_log(log) {
    // Skip logs that aren't valid for processing
    if (!is_valid_for_processing(log)) {
        return null;
    }
    
    // Extract evidence from the message body
    const evidence = extract_evidence(log.body);
    const found_evidence = has_evidence(evidence);
    
    // Return formatted result if evidence was found
    if (found_evidence) {
        return {
            mid: log.mid,
            sadad: evidence.sadads,
            log_body: log.body
        };
    }
    
    return null;
}


function store_evidence(result) {
    const timestamp = new Date().toISOString();
    
    // Store SADADs
    result.sadad.forEach(({ sadad_number, sadad_type }) => {
        const id = crypto.createHash('sha256').update(result.mid + ':' + sadad_number).digest('hex');
        add_or_update_sadad({
            id: id,
            FPG_logs_id: result.mid,
            sadad_number: sadad_number,
            sadad_type: sadad_type,
            original_text: result.log_body,
            created_at: timestamp,
            updated_at: timestamp
        });
    });
}


function collect_evidence_data_sadad_version() {
    const dbPath = path.join(__dirname, '../FPG.db');
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.error('Error opening database:', err);
            return;
        }
    });

    get_all_IBAN_log_ids().then(ibanLogIds => {
        const ibanLogIdSet = new Set(ibanLogIds);

        get_all_FPG_logs((err, logs) => {
            if (err) {
                console.error('Error fetching FPG logs:', err);
                db.close();
                return;
            }

            // Process all logs (no filtering by is_processed)
            console.log(`[${new Date().toISOString()}] Found ${logs.length} logs to process for SADAD`);

            const evidence_results = [];

            logs.forEach((log) => {
                // Skip if this log already has an IBAN record
                if (ibanLogIdSet.has(log.mid)) {
                    return;
                }

                const result = process_log(log);

                if (result) {
                    evidence_results.push(result);
                    store_evidence(result);
                }
            });

            console.log(`[${new Date().toISOString()}] Processing complete. Found ${evidence_results.length} logs with SADAD evidence.`);
            if (evidence_results.length > 0) {
                console.log('SADAD evidence stored in sadad table.');
            }

            db.close();
        });
    }).catch(err => {
        console.error('Error fetching IBAN log IDs:', err);
        db.close();
    });
}

// To run the collection process once, uncomment below:
collect_evidence_data_sadad_version();

module.exports = {
    collect_evidence_data_sadad_version
};
