const fs = require('fs');                           // load the filesystem module
const path = require('path');                       // load the path-join helper

const logs_dir = path.join(__dirname, '../Logs');   // resolve the Logs directory path

function log_action(action, details = '') {         // define the action logging function
        const log_file = path.join(logs_dir, `${get_date_string()}.log`);  // build today's log file path
        const now = new Date();                     // capture the current time
        const readable_timestamp = now.getFullYear() + '-' +  // start building the year-prefixed timestamp
            String(now.getMonth() + 1).padStart(2, '0') + '-' +  // add the zero-padded month
            String(now.getDate()).padStart(2, '0') + ' ' +  // add the zero-padded day
            String(now.getHours()).padStart(2, '0') + ':' +  // add the zero-padded hour
            String(now.getMinutes()).padStart(2, '0') + ':' +  // add the zero-padded minute
            String(now.getSeconds()).padStart(2, '0');  // add the zero-padded second
        const log_entry = `[${readable_timestamp}] ACTION: ${action}${details ? ' | ' + details : ''}\n`;  // format the full log line
        fs.appendFileSync(log_file, log_entry, { encoding: 'utf8' });  // append the entry to today's log file
}                                                   // end log_action

function get_date_string() {                        // define the date-string helper
    const now = new Date();                         // capture the current time
    return now.toISOString().slice(0, 10); // YYYY-MM-DD
}                                                   // end get_date_string

module.exports = { log_action };                    // export the log_action function
