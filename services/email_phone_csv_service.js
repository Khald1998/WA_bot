const SERVICE_FILE_NAME = 'services/email_phone_csv_service.js';
const FUNCTION_NAME = 'email_phone_csv_service';

const { log_action } = require('../debug/logger');
const generate_filename = require('../email_helper/email_generate_filename');
const generate_phone_csv = require('../generate_report/generate_phone_csv');
const create_transporter = require('../email_helper/email_create_transporter');
const send_to_all_recipients = require('../email_helper/email_send_to_all_recipients');
const get_phones_by_time = require('../getters/get_phones_by_time');


function build_subject(start_time, end_time) {
  return `Phone Numbers Export - ${start_time} to ${end_time}`;
}

function build_text_body(start_time, end_time, count) {
  return `Phone Numbers Export\nPeriod: ${start_time} to ${end_time}\nTotal records: ${count}`;
}

function build_html_body(start_time, end_time, count) {
  return `
    <h3>Phone Numbers Export</h3>
    <p><strong>Period:</strong> ${start_time} to ${end_time}</p>
    <p><strong>Total records:</strong> ${count}</p>
  `;
}

async function email_phone_csv_service(email_config, start_time, end_time, emails) {
  try {
    log_action('EMAIL_PHONE_CSV_QUERY_ATTEMPT', `start_time: ${start_time}, end_time: ${end_time}`);

    const phones = await get_phones_by_time(start_time, end_time);
    log_action('EMAIL_PHONE_CSV_QUERY_SUCCESS', `Found ${phones.length} phone numbers`);

    if (phones.length === 0) {
      log_action('EMAIL_PHONE_CSV_NO_DATA', 'No phone numbers found in the specified time range');
      return { success: false, message: 'No phone numbers found in the specified time range' };
    }

    const csv_content = generate_phone_csv(phones);
    log_action('EMAIL_PHONE_CSV_GENERATED', `CSV size: ${csv_content.length} bytes`);

    const file_name = generate_filename('phones', start_time, end_time);
    const transporter = create_transporter(email_config);
    const subject = build_subject(start_time, end_time);
    const text_body = build_text_body(start_time, end_time, phones.length);
    const html_body = build_html_body(start_time, end_time, phones.length);

    const results = await send_to_all_recipients(
      transporter,
      email_config,
      emails,
      file_name,
      csv_content,
      phones.length,
      start_time,
      end_time,
      subject,
      text_body,
      html_body,
      log_action,
      'EMAIL_PHONE_CSV'
    );

    return {
      success: true,
      file_name,
      record_count: phones.length,
      sent_to: results
    };

  } catch (err) {
    log_action('EMAIL_PHONE_CSV_ERROR', `error: ${err.message}`);
    throw err;
  }
}

module.exports = { email_phone_csv_service };