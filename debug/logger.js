const fs = require('fs');
const path = require('path');

const logs_dir = path.join(__dirname, '../Logs');

function log_action(action, details = '') {
    const log_file = path.join(logs_dir, `${get_date_string()}.log`);
    const log_entry = `[${new Date().toISOString()}] ACTION: ${action}${details ? ' | ' + details : ''}\n`;
    fs.appendFileSync(log_file, log_entry, { encoding: 'utf8' });
}

function get_date_string() {
    const now = new Date();
    return now.toISOString().slice(0, 10); // YYYY-MM-DD
}

module.exports = { log_action };
