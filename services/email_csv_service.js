const { log_action } = require('../debug/logger');
const generate_filename = require('../email_helper/email_generate_filename');
const create_transporter = require('../email_helper/email_create_transporter');
const send_to_all_recipients = require('../email_helper/email_send_to_all_recipients');
const email_build_subject = require('../email_helper/email_build_subject');
const email_build_text_body = require('../email_helper/email_build_text_body');
const email_build_html_body = require('../email_helper/email_build_html_body');

async function email_csv_service(email_config, start_time, end_time, to, cc, label, get_data, generate_csv) {
  try {
    log_action('EMAIL_CSV_QUERY_ATTEMPT', `start_time: ${start_time}, end_time: ${end_time}`);

    const records = await get_data(start_time, end_time);
    log_action('EMAIL_CSV_QUERY_SUCCESS', `Found ${records.length} records`);

    if (records.length === 0) {
      log_action('EMAIL_CSV_NO_DATA', 'No records found in the specified time range');
      return { success: false, message: 'No records found in the specified time range' };
    }

    const csv_content = generate_csv(records);
    log_action('EMAIL_CSV_GENERATED', `CSV size: ${csv_content.length} bytes`);

    const file_name = generate_filename(label, start_time, end_time);
    const transporter = create_transporter(email_config);
    const subject = email_build_subject(label, start_time, end_time);
    const text_body = email_build_text_body(label, start_time, end_time, records.length);
    const html_body = email_build_html_body(label, start_time, end_time, records.length);

    const results = await send_to_all_recipients(
      transporter, email_config, to, file_name, csv_content,
      subject, text_body, html_body, cc
    );

    return { success: true, file_name, record_count: records.length, sent_to: results };
  } catch (err) {
    log_action('EMAIL_CSV_ERROR', `error: ${err.message}`);
    throw err;
  }
}

module.exports = email_csv_service;
