const SERVICE_FILE_NAME = 'services/email_sadad_csv_service.js';
const FUNCTION_NAME = 'email_sadad_csv_service';

const { log_action } = require('../debug/logger');
const generate_filename = require('../email_helper/email_generate_filename');
const generate_sadad_csv = require('../generate_report/generate_sadad_csv');
const create_transporter = require('../email_helper/email_create_transporter');
const send_to_all_recipients = require('../email_helper/email_send_to_all_recipients');
const get_sadads_by_time = require('../getters/get_sadads_by_time');


function build_subject(start_time, end_time) {
  return `SADAD Export - ${start_time} to ${end_time}`;
}

function build_text_body(start_time, end_time, count) {
  return `SADAD Export\nPeriod: ${start_time} to ${end_time}\nTotal records: ${count}`;
}

function build_html_body(start_time, end_time, count) {
  return `
    <h3>SADAD Export</h3>
    <p><strong>Period:</strong> ${start_time} to ${end_time}</p>
    <p><strong>Total records:</strong> ${count}</p>
  `;
}

async function email_sadad_csv_service(email_config, start_time, end_time, to, cc) {
  try {
    log_action('EMAIL_SADAD_CSV_QUERY_ATTEMPT', `start_time: ${start_time}, end_time: ${end_time}`);

    const sadads = await get_sadads_by_time(start_time, end_time);
    log_action('EMAIL_SADAD_CSV_QUERY_SUCCESS', `Found ${sadads.length} SADADs`);

    if (sadads.length === 0) {
      log_action('EMAIL_SADAD_CSV_NO_DATA', 'No SADADs found in the specified time range');
      return { success: false, message: 'No SADADs found in the specified time range' };
    }

    const csv_content = generate_sadad_csv(sadads);
    log_action('EMAIL_SADAD_CSV_GENERATED', `CSV size: ${csv_content.length} bytes`);

    const file_name = generate_filename('sadads', start_time, end_time);
    const transporter = create_transporter(email_config);
    const subject = build_subject(start_time, end_time);
    const text_body = build_text_body(start_time, end_time, sadads.length);
    const html_body = build_html_body(start_time, end_time, sadads.length);

    const results = await send_to_all_recipients(
      transporter,
      email_config,
      to,
      file_name,
      csv_content,
      sadads.length,
      start_time,
      end_time,
      subject,
      text_body,
      html_body,
      log_action,
      'EMAIL_SADAD_CSV',
      cc
    );

    return {
      success: true,
      file_name,
      record_count: sadads.length,
      sent_to: results
    };

  } catch (err) {
    log_action('EMAIL_SADAD_CSV_ERROR', `error: ${err.message}`);
    throw err;
  }
}

module.exports = email_sadad_csv_service;
