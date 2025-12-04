

const get_all_FPG_logs = require('../db/utility/get_all_FPG_logs');
const update_fpg_log = require('../db/utility/update_FPG_log');
const parser_iban = require('../parser/parser_iban');
const parser_phone = require('../parser/parser_phone');
const parser_national_id = require('../parser/parser_national_id');



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


function collect_evidence_data() {
    get_all_FPG_logs((err, logs) => {
        if (err) {
            console.error('Error fetching FPG logs:', err);
            return;
        }
        // Filter to only unprocessed logs
        const unprocessed_logs = logs.filter(log => log.is_processed !== true);
        console.log(`Found ${unprocessed_logs.length} unprocessed logs to process`);
        // Process each log and collect results
        const evidence_results = [];
        for (const log of unprocessed_logs) {
            const result = process_log(log);
            if (result) {
                evidence_results.push(result);
            }
        }
        // Display summary
        console.log(`Processing complete. Found ${evidence_results.length} logs with evidence.`);
        // if (evidence_results.length > 0) {
        //     console.log('Evidence Results:', JSON.stringify(evidence_results, null, 2));
        // }
    });
}

// Run the collection process
try {
    collect_evidence_data();
} catch (error) {
    console.error('Unexpected error during evidence collection:', error);
    process.exit(1);
}
