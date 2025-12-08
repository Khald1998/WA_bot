const SERVICE_FILE_NAME = 'services/email_phone_csv_service.js';
const FUNCTION_NAME = 'email_phone_csv_service';



const { log_action } = require('../debug/logger');
const nodemailer = require('nodemailer');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// ============================================
// Helper Functions
// ============================================

/**
 * Queries phone numbers from database within time range
 */
function query_phones_from_database(db, start_time, end_time) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id, FPG_logs_id, phone_number, original_text, created_at, updated_at
      FROM phone
      WHERE created_at >= ? AND created_at <= ?
      ORDER BY created_at ASC
    `;
    
    db.all(query, [start_time, end_time], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

/**
 * Converts phone data to CSV format
 */
function convert_phones_to_csv(phones) {
  const csv_header = 'id,FPG_logs_id,phone_number,original_text,created_at,updated_at\n';
  const csv_rows = phones.map(phone => {
    return [
      phone.id,
      phone.FPG_logs_id,
      `"${phone.phone_number}"`,
      `"${phone.original_text.replace(/"/g, '""')}"`,
      phone.created_at,
      phone.updated_at
    ].join(',');
  });
  return csv_header + csv_rows.join('\n');
}

/**
 * Generates filename with timestamp
 */
function generate_file_name(start_time, end_time, prefix = 'phones') {
  return `${prefix}_${start_time.replace(/:/g, '-')}_to_${end_time.replace(/:/g, '-')}.csv`;
}

/**
 * Creates nodemailer transporter
 */
function create_email_transporter(email_config) {
  return nodemailer.createTransport({
    host: email_config.host,
    port: email_config.port,
    secure: email_config.secure,
    auth: {
      user: email_config.user,
      pass: email_config.pass
    }
  });
}

/**
 * Prepares email options with CSV attachment
 */
function prepare_email_options(email_config, email, file_name, csv_content, record_count, start_time, end_time) {
  return {
    from: email_config.from,
    to: email,
    subject: `Phone Numbers Export - ${start_time} to ${end_time}`,
    text: `Phone Numbers Export\nPeriod: ${start_time} to ${end_time}\nTotal records: ${record_count}`,
    html: `<h3>Phone Numbers Export</h3>
           <p><strong>Period:</strong> ${start_time} to ${end_time}</p>
           <p><strong>Total records:</strong> ${record_count}</p>`,
    attachments: [
      {
        filename: file_name,
        content: csv_content,
        contentType: 'text/csv'
      }
    ]
  };
}

/**
 * Sends email to a single recipient
 */
async function send_email_to_recipient(transporter, email_config, email, file_name, csv_content, record_count, start_time, end_time) {
  log_action('EMAIL_PHONE_CSV_SEND_ATTEMPT', `to: ${email}, fileName: ${file_name}`);
  try {
    const mail_options = prepare_email_options(email_config, email, file_name, csv_content, record_count, start_time, end_time);
    await transporter.sendMail(mail_options);
    log_action('EMAIL_PHONE_CSV_SEND_SUCCESS', `to: ${email}`);
    return { email, success: true };
  } catch (send_err) {
    log_action('EMAIL_PHONE_CSV_SEND_ERROR', `to: ${email}, error: ${send_err.message}`);
    return { email, success: false, error: send_err.message };
  }
}

/**
 * Sends emails to all recipients
 */
async function send_emails_to_all_recipients(transporter, email_config, emails, file_name, csv_content, record_count, start_time, end_time) {
  const results = [];
  for (const email of emails) {
    const result = await send_email_to_recipient(transporter, email_config, email, file_name, csv_content, record_count, start_time, end_time);
    results.push(result);
  }
  return results;
}


async function email_phone_csv_service(email_config, start_time, end_time, emails) {
  const db_path = path.join(__dirname, '../FPG.db');
  const db = new sqlite3.Database(db_path);
  try {
    log_action('EMAIL_PHONE_CSV_QUERY_ATTEMPT', `startTime: ${start_time}, endTime: ${end_time}`);
    const phones = await query_phones_from_database(db, start_time, end_time);
    log_action('EMAIL_PHONE_CSV_QUERY_SUCCESS', `Found ${phones.length} phone numbers`);
    if (phones.length === 0) {
      log_action('EMAIL_PHONE_CSV_NO_DATA', 'No phone numbers found in the specified time range');
      db.close();
      return { success: false, message: 'No phone numbers found in the specified time range' };
    }
    const csv_content = convert_phones_to_csv(phones);
    log_action('EMAIL_PHONE_CSV_GENERATED', `CSV size: ${csv_content.length} bytes`);
    const file_name = generate_file_name(start_time, end_time, 'phones');
    const transporter = create_email_transporter(email_config);
    const results = await send_emails_to_all_recipients(
      transporter,
      email_config,
      emails,
      file_name,
      csv_content,
      phones.length,
      start_time,
      end_time
    );
    db.close();
    return {
      success: true,
      file_name,
      record_count: phones.length,
      sent_to: results
    };
  } catch (error) {
    log_action('EMAIL_PHONE_CSV_ERROR', `error: ${error.message}`);
    db.close();
    throw error;
  }
}

module.exports = email_phone_csv_service;
