// services/error_report_service.js
// Service to send error reports via WhatsApp



const SERVICE_FILE_NAME = 'services/error_report_service.js';
const FUNCTION_NAME = 'error_report';
const { send_message_service } = require('../services/send_message_service');

async function error_report(client, { service_file_name, function_name, error_message }) {
    const project_name = 'WhatsappBot';
    const number = '966580599359';
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const message = `🚨 *ERROR REPORT* 🚨\n\n• *Project:* \`${project_name}\`\n• *File:* \`${service_file_name}\`\n• *Function:* \`${function_name}\`\n• *Timestamp:* \`${timestamp}\`\n• *Error Message:*\n\`\`\`${error_message}\`\`\``;
    try {
        const result = await send_message_service(client, number, message);
        console.log('Error report sent successfully!');
        return result;
    } catch (e) {
        console.error('An error occurred while sending error report:', e.message);
        return null;
    }
}

module.exports = { error_report };
