// crontab/collect_data.js
// This script is intended for scheduled data collection tasks.
// Add your data collection logic below.

console.log('Data collection script started.');

// TODO: Implement data collection logic here.

const getAllFPGLogs = require('../db/utility/get_all_FPG_logs');

getAllFPGLogs((err, logs) => {
    if (err) {
        console.error('Error fetching FPG_logs:', err);
    } else {
        console.log('FPG_logs data:', logs);
        console.log('Total FPG_logs entries:', logs.length);
    }
});
