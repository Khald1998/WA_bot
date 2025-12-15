const SERVICE_FILE_NAME = 'services/send_phone_csv_service.js';
const FUNCTION_NAME = 'send_phone_csv_service';
// Service logic for extracting phone numbers within a time range, converting to CSV, and sending to WhatsApp

const { log_action } = require('../debug/logger');
const { MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();


async function send_phone_csv_service(client, startTime, endTime, numbers) {
  const dbPath = path.join(__dirname, '../FPG.db');
  const db = new sqlite3.Database(dbPath);

  try {
    log_action('PHONE_CSV_QUERY_ATTEMPT', `startTime: ${startTime}, endTime: ${endTime}`);

    // Query phone numbers from database within the time range
    const phones = await new Promise((resolve, reject) => {
      const query = `
        SELECT id, FPG_logs_id, phone_number, original_text, created_at, updated_at
        FROM phone
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

    log_action('PHONE_CSV_QUERY_SUCCESS', `Found ${phones.length} phone numbers`);

    if (phones.length === 0) {
      log_action('PHONE_CSV_NO_DATA', 'No phone numbers found in the specified time range');
      db.close();
      return { success: false, message: 'No phone numbers found in the specified time range' };
    }

    // Convert to CSV format
    const csvHeader = 'id,FPG_logs_id,phone_number,original_text,created_at,updated_at\n';
    const csvRows = phones.map(phone => {
      return [
        phone.id,
        phone.FPG_logs_id,
        `"${phone.phone_number}"`,
        `"${phone.original_text.replace(/"/g, '""')}"`, // Escape quotes in CSV
        phone.created_at,
        phone.updated_at
      ].join(',');
    });
    const csvContent = csvHeader + csvRows.join('\n');

    log_action('PHONE_CSV_GENERATED', `CSV size: ${csvContent.length} bytes`);

    // Create MessageMedia from CSV buffer
    const csvBuffer = Buffer.from(csvContent, 'utf-8');
    const base64Data = csvBuffer.toString('base64');
    const fileName = `phones_${startTime.replace(/:/g, '-')}_to_${endTime.replace(/:/g, '-')}.csv`;
    
    const media = new MessageMedia('text/csv', base64Data, fileName);

    // Send to all numbers in the list
    const results = [];
    for (const number of numbers) {
      const normalized = number.replace(/\D/g, '');
      const chat_id = `${normalized}@c.us`;

      log_action('PHONE_CSV_SEND_ATTEMPT', `to: ${chat_id}, fileName: ${fileName}`);

      try {
        await client.sendMessage(chat_id, media, {
          caption: `Phone Numbers Export\nPeriod: ${startTime} to ${endTime}\nTotal records: ${phones.length}`
        });
        log_action('PHONE_CSV_SEND_SUCCESS', `to: ${chat_id}`);
        results.push({ number: chat_id, success: true });
      } catch (sendErr) {
        log_action('PHONE_CSV_SEND_ERROR', `to: ${chat_id}, error: ${sendErr.message}`);
        results.push({ number: chat_id, success: false, error: sendErr.message });
      }
    }

    db.close();

    return {
      success: true,
      fileName: fileName,
      recordCount: phones.length,
      sentTo: results
    };

  } catch (err) {
    log_action('PHONE_CSV_ERROR', `error: ${err.message}`);
    db.close();
    throw err;
  }
}

module.exports = { send_phone_csv_service };
