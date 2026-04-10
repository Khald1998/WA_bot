const SERVICE_FILE_NAME = 'services/email_iban_raw_service.js';
const FUNCTION_NAME = 'email_iban_raw_service';

const { log_action } = require('../debug/logger');
const get_unreported_ibans = require('../db/utility/get_unreported_IBANs');
const mark_ibans_as_reported = require('../db/utility/mark_ibans_as_reported');
const create_transporter = require('./helper/email_create_transporter');

function build_subject(count) {
  return `Unreported IBANs - ${count} records`;
}

function build_text_body(ibans) {
  let body = `Unreported IBAN Records\nTotal: ${ibans.length}\n\n`;
  
  ibans.forEach((iban, index) => {
    body += `Record ${index + 1}:\n`;
    body += `  IBAN Number: ${iban.iban_number}\n`;
    body += `  Original Text: ${iban.original_text}\n`;
    body += `  Created At: ${iban.created_at}\n`;
    body += `\n`;
  });
  
  return body;
}

function build_html_body(ibans) {
  let html = `
    <h3>Unreported IBAN Records</h3>
    <p><strong>Total:</strong> ${ibans.length}</p>
    <hr>
  `;
  
  ibans.forEach((iban, index) => {
    html += `
      <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
        <h4>Record ${index + 1}</h4>
        <p><strong>IBAN Number:</strong> ${iban.iban_number}</p>
        <p><strong>Original Text:</strong> ${iban.original_text}</p>
        <p><strong>Created At:</strong> ${iban.created_at}</p>
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
  log_action('EMAIL_IBAN_RAW_SEND_ATTEMPT', `to: ${to_addresses}`);
  
  try {
    await send_email(transporter, config, to_addresses, subject, text_body, html_body, cc);
    log_action('EMAIL_IBAN_RAW_SEND_SUCCESS', `to: ${to_addresses}`);
    return { success: true, sent_to: to };
  } catch (err) {
    log_action('EMAIL_IBAN_RAW_SEND_ERROR', `to: ${to_addresses}, error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function email_iban_raw_service(email_config, to, cc) {
  try {
    log_action('EMAIL_IBAN_RAW_QUERY_ATTEMPT', 'Fetching unreported IBANs');

    const ibans = await get_unreported_ibans();
    log_action('EMAIL_IBAN_RAW_QUERY_SUCCESS', `Found ${ibans.length} unreported IBANs`);

    if (ibans.length === 0) {
      log_action('EMAIL_IBAN_RAW_NO_DATA', 'No unreported IBANs found');
      return { success: false, message: 'No unreported IBANs found' };
    }

    const transporter = create_transporter(email_config);
    const subject = build_subject(ibans.length);
    const text_body = build_text_body(ibans);
    const html_body = build_html_body(ibans);

    const results = await send_to_all_recipients(
      transporter,
      email_config,
      to,
      subject,
      text_body,
      html_body,
      cc
    );

    // Mark IBANs as reported after successful email sending
    const iban_ids = ibans.map(iban => iban.id);
    const mark_result = await mark_ibans_as_reported(iban_ids);
    log_action('EMAIL_IBAN_RAW_MARK_REPORTED', `Marked ${mark_result.changes} IBANs as reported`);

    return {
      success: results.success,
      record_count: ibans.length,
      marked_as_reported: mark_result.changes,
      sent_to: results.sent_to,
      cc: cc,
      error: results.error
    };

  } catch (err) {
    log_action('EMAIL_IBAN_RAW_ERROR', `error: ${err.message}`);
    throw err;
  }
}

module.exports = email_iban_raw_service;
