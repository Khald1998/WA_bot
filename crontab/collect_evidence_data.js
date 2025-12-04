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

try {
    get_all_FPG_logs((err, logs) => {
        if (err) {
            console.error('Error fetching FPG_logs:', err);
        } else {
            // First filter: get logs that are not processed (is_processed !== true)
            const unprocessed_logs = logs.filter(log => log.is_processed !== true);
            
            const results = [];
            for (const log of unprocessed_logs) {
                // Second check: determine if it's valid for processing
                const is_valid_type = log.type === 'chat' || 
                    ((log.type === 'image' || log.type === 'video') && log.body);
                
                if (!is_valid_type) {
                    // Set is_processed to true for non-chat and image/video without body
                    update_fpg_log(log._serialized, { is_processed: true }, (err) => {
                        if (err) console.error(`Error updating log ${log._serialized}:`, err);
                    });
                    continue;
                }
                
                // Process valid logs
                const iban_parsed = parser_iban(log.body);
                const phone_parsed = parser_phone(log.body);
                const national_id_parsed = parser_national_id(log.body);
                
                // Mark the log as having been processed
                const has_evidence = iban_parsed.length > 0 || phone_parsed.length > 0 || national_id_parsed.length > 0;
                update_fpg_log(log._serialized, { 
                    is_processed: true,
                    is_valid_evidence: has_evidence ? 1 : 0
                }, (err) => {
                    if (err) console.error(`Error updating log ${log._serialized}:`, err);
                });

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
            console.log('Filtered Results:', results);
            console.log('Total unprocessed logs:', unprocessed_logs.length);
        }
    });
} catch (e) {
    console.error('Unexpected error:', e);
}
