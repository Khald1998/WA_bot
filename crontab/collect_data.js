// crontab/collect_data.js
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
                (log.type === 'chat' ||
                 ((log.type === 'image' || log.type === 'video') && log.body))
            );
            for (const log of chatLogs) {
                // Use the parser functions on relevant fields if present
                // const ibanParsed = parser_iban(log.body);
                const phoneParsed = parser_phone(log.body);
                // const nationalIdParsed = parser_national_id(log.body);
                console.log({
                    mid: log.mid,
                    // iban: ibanParsed,
                    phone: phoneParsed,
                    // national_id: nationalIdParsed
                });
            }
            console.log('Total FPG_logs entries:', chatLogs.length);
        }
    });
} catch (e) {
    console.error('Unexpected error:', e);
}
