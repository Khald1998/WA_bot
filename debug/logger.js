const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, '../Logs');

function logAction(action, details = '') {
    const logFile = path.join(LOGS_DIR, `${getDateString()}.log`);
    const logEntry = `[${new Date().toISOString()}] ACTION: ${action}${details ? ' | ' + details : ''}\n`;
    fs.appendFileSync(logFile, logEntry, { encoding: 'utf8' });
}

function getDateString() {
    const now = new Date();
    return now.toISOString().slice(0, 10); // YYYY-MM-DD
}

module.exports = { logAction };
