const SERVICE_FILE_NAME = 'services/email_national_id_raw_service.js';
const FUNCTION_NAME = 'email_national_id_raw_service';

const { log_action } = require('../debug/logger');
const get_unreported_national_ids = require('../db/utility/get_unreported_national_ids');
const mark_national_ids_as_reported = require('../db/utility/mark_national_ids_as_reported');
const create_transporter = require('./helper/email_create_transporter');

function build_subject(count) {
  return `Unreported National IDs - ${count} records`;
}

function build_text_body(national_ids) {
  let body = `Unreported National ID Records\nTotal: ${national_ids.length}\n\n`;
  
  national_ids.forEach((record, index) => {
    body += `Record ${index + 1}:\n`;
    body += `  National ID Number: ${record.national_id_number}\n`;
    body += `  Original Text: ${record.original_text}\n`;
    body += `  Created At: ${record.created_at}\n`;
    body += `\n`;
  });
  
  return body;
}

function build_html_body(national_ids) {
  let html = `
    <h3>Unreported National ID Records</h3>
    <p><strong>Total:</strong> ${national_ids.length}</p>
    <hr>
  `;
  
  national_ids.forEach((record, index) => {
    html += `
      <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
        <h4>Record ${index + 1}</h4>
        <p><strong>National ID Number:</strong> ${record.national_id_number}</p>
        <p><strong>Original Text:</strong> ${record.original_text}</p>
        <p><strong>Created At:</strong> ${record.created_at}</p>
      </div>
    `;
  });
  
  return html;
}

async function send_email(transporter, config, email, subject, text_body, html_body, cc) {
  const mail_options = {
    from: config.from,
    to: email,
    subject: subject,
    text: text_body,
    html: html_body
  };
  
  if (cc && Array.isArray(cc) && cc.length > 0) {
    mail_options.cc = cc.join(', ');
  }

  return new Promise((resolve, reject) => {
    transporter.sendMail(mail_options, (err, info) => {
      if (err) {
        reject(err);
      } else {
        resolve(info);
      }
    });
  });
}

async function send_to_all_recipients(transporter, config, to, subject, text_body, html_body, cc) {
  // Send one email to all recipients
  const to_addresses = to.join(', ');
  log_action('EMAIL_NATIONAL_ID_RAW_SEND_ATTEMPT', `to: ${to_addresses}`);
  
  try {
    await send_email(transporter, config, to_addresses, subject, text_body, html_body, cc);
    log_action('EMAIL_NATIONAL_ID_RAW_SEND_SUCCESS', `to: ${to_addresses}`);
    return { success: true, sent_to: to };
  } catch (err) {
    log_action('EMAIL_NATIONAL_ID_RAW_SEND_ERROR', `to: ${to_addresses}, error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function email_national_id_raw_service(email_config, to, cc) {
  try {
    log_action('EMAIL_NATIONAL_ID_RAW_QUERY_ATTEMPT', 'Fetching unreported national IDs');

    const national_ids = await get_unreported_national_ids();
    log_action('EMAIL_NATIONAL_ID_RAW_QUERY_SUCCESS', `Found ${national_ids.length} unreported national IDs`);

    if (national_ids.length === 0) {
      log_action('EMAIL_NATIONAL_ID_RAW_NO_DATA', 'No unreported national IDs found');
      return { success: false, message: 'No unreported national IDs found' };
    }

    const transporter = create_transporter(email_config);
    const subject = build_subject(national_ids.length);
    const text_body = build_text_body(national_ids);
    const html_body = build_html_body(national_ids);

    const send_result = await send_to_all_recipients(transporter, email_config, to, subject, text_body, html_body, cc);

    if (!send_result.success) {
      return { success: false, error: send_result.error };
    }

    // Mark all national IDs as reported
    const national_id_ids = national_ids.map(n => n.id);
    const mark_result = await mark_national_ids_as_reported(national_id_ids);
    log_action('EMAIL_NATIONAL_ID_RAW_MARK_REPORTED', `Marked ${mark_result.changes} national IDs as reported`);

    return {
      success: true,
      record_count: national_ids.length,
      marked_as_reported: mark_result.changes,
      sent_to: to,
      cc: cc || []
    };

  } catch (err) {
    log_action('EMAIL_NATIONAL_ID_RAW_ERROR', `error: ${err.message}`);
    throw err;
  }
}

module.exports = email_national_id_raw_service;
