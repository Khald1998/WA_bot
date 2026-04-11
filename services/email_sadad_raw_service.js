const SERVICE_FILE_NAME = 'services/email_sadad_raw_service.js';
const FUNCTION_NAME = 'email_sadad_raw_service';

const { log_action } = require('../debug/logger');
const get_unreported_sadads = require('../getters/get_unreported_sadads');
const mark_sadads_as_reported = require('../db/utility/mark_sadads_as_reported');
const create_transporter = require('../email_helper/email_create_transporter');

function build_subject(count) {
  return `Unreported SADADs - ${count} records`;
}

function build_text_body(sadads) {
  let body = `Unreported SADAD Records\nTotal: ${sadads.length}\n\n`;

  sadads.forEach((sadad, index) => {
    body += `Record ${index + 1}:\n`;
    body += `  SADAD Number: ${sadad.sadad_number}\n`;
    body += `  SADAD Type: ${sadad.sadad_type}\n`;
    body += `  Original Text: ${sadad.original_text}\n`;
    body += `  Created At: ${sadad.created_at}\n`;
    body += `\n`;
  });

  return body;
}

function build_html_body(sadads) {
  let html = `
    <h3>Unreported SADAD Records</h3>
    <p><strong>Total:</strong> ${sadads.length}</p>
    <hr>
  `;

  sadads.forEach((sadad, index) => {
    html += `
      <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
        <h4>Record ${index + 1}</h4>
        <p><strong>SADAD Number:</strong> ${sadad.sadad_number}</p>
        <p><strong>SADAD Type:</strong> ${sadad.sadad_type}</p>
        <p><strong>Original Text:</strong> ${sadad.original_text}</p>
        <p><strong>Created At:</strong> ${sadad.created_at}</p>
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
  const to_addresses = to.join(', ');
  log_action('EMAIL_SADAD_RAW_SEND_ATTEMPT', `to: ${to_addresses}`);

  try {
    await send_email(transporter, config, to_addresses, subject, text_body, html_body, cc);
    log_action('EMAIL_SADAD_RAW_SEND_SUCCESS', `to: ${to_addresses}`);
    return { success: true, sent_to: to };
  } catch (err) {
    log_action('EMAIL_SADAD_RAW_SEND_ERROR', `to: ${to_addresses}, error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function email_sadad_raw_service(email_config, to, cc) {
  try {
    log_action('EMAIL_SADAD_RAW_QUERY_ATTEMPT', 'Fetching unreported SADADs');

    const sadads = await get_unreported_sadads();
    log_action('EMAIL_SADAD_RAW_QUERY_SUCCESS', `Found ${sadads.length} unreported SADADs`);

    if (sadads.length === 0) {
      log_action('EMAIL_SADAD_RAW_NO_DATA', 'No unreported SADADs found');
      return { success: false, message: 'No unreported SADADs found' };
    }

    const transporter = create_transporter(email_config);
    const subject = build_subject(sadads.length);
    const text_body = build_text_body(sadads);
    const html_body = build_html_body(sadads);

    const results = await send_to_all_recipients(
      transporter,
      email_config,
      to,
      subject,
      text_body,
      html_body,
      cc
    );

    if (!results.success) {
      return { success: false, error: results.error };
    }

    // Mark SADADs as reported after successful email sending
    const sadad_ids = sadads.map(s => s.id);
    const mark_result = await mark_sadads_as_reported(sadad_ids);
    log_action('EMAIL_SADAD_RAW_MARK_REPORTED', `Marked ${mark_result.changes} SADADs as reported`);

    return {
      success: true,
      record_count: sadads.length,
      marked_as_reported: mark_result.changes,
      sent_to: to,
      cc: cc || []
    };

  } catch (err) {
    log_action('EMAIL_SADAD_RAW_ERROR', `error: ${err.message}`);
    throw err;
  }
}

module.exports = email_sadad_raw_service;
