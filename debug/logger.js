const fs = require('fs');
const path = require('path');

const logs_dir = path.join(__dirname, '../Logs');

function log_action(action, details = '') {
        const log_file = path.join(logs_dir, `${get_date_string()}.log`);
        const now = new Date();
        const readable_timestamp = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0') + ' ' +
            String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0') + ':' +
            String(now.getSeconds()).padStart(2, '0');
        const log_entry = `[${readable_timestamp}] ACTION: ${action}${details ? ' | ' + details : ''}\n`;
        fs.appendFileSync(log_file, log_entry, { encoding: 'utf8' });
}

function get_date_string() {
    const now = new Date();
    return now.toISOString().slice(0, 10); // YYYY-MM-DD
}

module.exports = { log_action };
