// crontab/collect_evidence_data.js
// This script is intended for scheduled data collection tasks.
// Add your data collection logic below.

console.log('Data collection script started.');

// TODO: Implement data collection logic here.

const getAllFPGLogs = require('../db/utility/get_all_FPG_logs');
const parser_iban = require('../parser/parser_iban');
const parser_phone = require('../parser/parser_phone');
const parser_national_id = require('../parser/parser_national_id');

try {
    getAllFPGLogs((err, logs) => {
        if (err) {
            console.error('Error fetching FPG_logs:', err);
        } else {
            const chatLogs = logs.filter(log =>
                log.is_processed === false &&
                (log.type === 'chat' ||
                 ((log.type === 'image' || log.type === 'video') && log.body))
            );
            const results = [];
            for (const log of chatLogs) {
                const ibanParsed = parser_iban(log.body);
                const phoneParsed = parser_phone(log.body);
                const nationalIdParsed = parser_national_id(log.body);
                // mark the log as having been processed data (set is_processed to true)

                if (ibanParsed.length || phoneParsed.length || nationalIdParsed.length) {
                    // mark the log as having evidence data (set is_valid_evidence to true)
                    results.push({
                        mid: log.mid,
                        iban: ibanParsed,
                        phone: phoneParsed,
                        national_id: nationalIdParsed,
                        log_body: log.body
                    });
                }
            }
            console.log('Filtered Results:', results);
            console.log('Total FPG_logs entries:', chatLogs.length);
        }
    });
} catch (e) {
    console.error('Unexpected error:', e);
}
