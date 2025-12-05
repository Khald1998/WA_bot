

const get_all_FPG_logs = require('../db/utility/get_all_FPG_logs');
const update_fpg_log = require('../db/utility/update_FPG_log');
const parser_iban = require('../parser/parser_iban');
const parser_phone = require('../parser/parser_phone');
const parser_national_id = require('../parser/parser_national_id');
const add_or_update_IBAN = require('../db/utility/add_or_update_IBAN');
const add_or_update_phone = require('../db/utility/add_or_update_phone');
const add_or_update_national_id = require('../db/utility/add_or_update_national_id');
const crypto = require('crypto');



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


function mark_as_processed(serialized_id, is_valid_evidence = false) {
    const update_data = {
        is_processed: true,
        is_valid_evidence: is_valid_evidence ? 1 : 0
    };
    update_fpg_log(serialized_id, update_data, (err) => {
        if (err) {
            console.error(`Failed to update log ${serialized_id}:`, err);
        }
    });
}


function process_log(log) {
    // Skip logs that aren't valid for processing
    if (!is_valid_for_processing(log)) {
        mark_as_processed(log._serialized, false);
        return null;
    }
    // Extract evidence from the message body
    const evidence = extract_evidence(log.body);
    const found_evidence = has_evidence(evidence);
    // Update the log status in database
    mark_as_processed(log._serialized, found_evidence);
    // Return formatted result if evidence was found
    if (found_evidence) {
        return {
            mid: log.mid,
            iban: evidence.ibans,
            phone: evidence.phones,
            national_id: evidence.national_ids,
            log_body: log.body
        };
    }
    return null;
}


function store_evidence(result) {
    const timestamp = new Date().toISOString();
    
    // Store IBANs
    result.iban.forEach(iban => {
        const id = crypto.randomBytes(16).toString('hex');
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
        const id = crypto.randomBytes(16).toString('hex');
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
        const id = crypto.randomBytes(16).toString('hex');
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
    get_all_FPG_logs((err, logs) => {
        if (err) {
            console.error('Error fetching FPG logs:', err);
            return;
        }
        // Filter to only unprocessed logs
        const unprocessed_logs = logs.filter(log => log.is_processed !== true);
        console.log(`[${new Date().toISOString()}] Found ${unprocessed_logs.length} unprocessed logs to process`);
        
        // Process each log and collect results
        const evidence_results = [];
        for (const log of unprocessed_logs) {
            const result = process_log(log);
            if (result) {
                evidence_results.push(result);
                store_evidence(result);
            }
        }
        
        // Display summary
        console.log(`[${new Date().toISOString()}] Processing complete. Found ${evidence_results.length} logs with evidence.`);
        if (evidence_results.length > 0) {
            console.log('Evidence stored in respective tables.');
        }
    });
}

// To run the collection process once, uncomment below:
collect_evidence_data();
