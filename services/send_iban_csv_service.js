const SERVICE_FILE_NAME = 'services/send_iban_csv_service.js';
const FUNCTION_NAME = 'send_iban_csv_service';
// Service logic for extracting IBANs within a time range, converting to CSV, and sending to WhatsApp

const { log_action } = require('../debug/logger');
const { MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

/**
 * Sends IBANs created between start and end time as a CSV file to WhatsApp numbers
 * @param {Object} client - WhatsApp client instance
 * @param {string} startTime - Start time in ISO format (e.g., '2024-01-01T00:00:00')
 * @param {string} endTime - End time in ISO format (e.g., '2024-12-31T23:59:59')
 * @param {Array<string>} numbers - Array of WhatsApp numbers to send the CSV to
 * @returns {Promise<Object>} - Result object with success status
 */
async function send_iban_csv_service(client, startTime, endTime, numbers) {
  const dbPath = path.join(__dirname, '../FPG.db');
  const db = new sqlite3.Database(dbPath);

  try {
    log_action('IBAN_CSV_QUERY_ATTEMPT', `startTime: ${startTime}, endTime: ${endTime}`);

    // Query IBANs from database within the time range
    const ibans = await new Promise((resolve, reject) => {
      const query = `
        SELECT id, FPG_logs_id, iban_number, original_text, created_at, updated_at
        FROM IBAN
        WHERE created_at >= ? AND created_at <= ?
        ORDER BY created_at ASC
      `;
      
      db.all(query, [startTime, endTime], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    log_action('IBAN_CSV_QUERY_SUCCESS', `Found ${ibans.length} IBANs`);

    if (ibans.length === 0) {
      log_action('IBAN_CSV_NO_DATA', 'No IBANs found in the specified time range');
      db.close();
      return { success: false, message: 'No IBANs found in the specified time range' };
    }

    // Convert to CSV format
    const csvHeader = 'id,FPG_logs_id,iban_number,original_text,created_at,updated_at\n';
    const csvRows = ibans.map(iban => {
      return [
        iban.id,
        iban.FPG_logs_id,
        `"${iban.iban_number}"`,
        `"${iban.original_text.replace(/"/g, '""')}"`, // Escape quotes in CSV
        iban.created_at,
        iban.updated_at
      ].join(',');
    });
    const csvContent = csvHeader + csvRows.join('\n');

    log_action('IBAN_CSV_GENERATED', `CSV size: ${csvContent.length} bytes`);

    // Create MessageMedia from CSV buffer
    const csvBuffer = Buffer.from(csvContent, 'utf-8');
    const base64Data = csvBuffer.toString('base64');
    const fileName = `ibans_${startTime.replace(/:/g, '-')}_to_${endTime.replace(/:/g, '-')}.csv`;
    
    const media = new MessageMedia('text/csv', base64Data, fileName);

    // Send to all numbers in the list
    const results = [];
    for (const number of numbers) {
      const normalized = number.replace(/\D/g, '');
      const chat_id = `${normalized}@c.us`;

      log_action('IBAN_CSV_SEND_ATTEMPT', `to: ${chat_id}, fileName: ${fileName}`);

      try {
        await client.sendMessage(chat_id, media, {
          caption: `IBAN Export\nPeriod: ${startTime} to ${endTime}\nTotal records: ${ibans.length}`
        });
        log_action('IBAN_CSV_SEND_SUCCESS', `to: ${chat_id}`);
        results.push({ number: chat_id, success: true });
      } catch (sendErr) {
        log_action('IBAN_CSV_SEND_ERROR', `to: ${chat_id}, error: ${sendErr.message}`);
        results.push({ number: chat_id, success: false, error: sendErr.message });
      }
    }

    db.close();

    return {
      success: true,
      fileName: fileName,
      recordCount: ibans.length,
      sentTo: results
    };

  } catch (err) {
    log_action('IBAN_CSV_ERROR', `error: ${err.message}`);
    db.close();
    throw err;
  }
}

module.exports = { send_iban_csv_service };
