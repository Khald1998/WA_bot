const { log_action } = require('../debug/logger');
const { create_transporter } = require('../email_helper/email_create_transporter');
const send_email = require('../email_helper/email_send_to_recipient');
const build_attachment = require('../email_helper/email_build_attachment');

async function email_csv_service(start_time, end_time, to, cc, label, get_data, generate_csv, text_body, html_body) {
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

    const file_name = `${label}_${start_time.replace(/:/g, '-')}_to_${end_time.replace(/:/g, '-')}.csv`;
    const transporter = create_transporter();

    const final_subject = `${label} Export - ${start_time} to ${end_time}`;
    const final_text = text_body || `${label} Export\nPeriod: ${start_time} to ${end_time}\nTotal records: ${records.length}`;
    const final_html = html_body || `<h3>${label} Export</h3><p><strong>Period:</strong> ${start_time} to ${end_time}</p><p><strong>Total records:</strong> ${records.length}</p>`;

    await send_email(transporter, {
      to, cc,
      subject: final_subject,
      text: final_text,
      html: final_html,
      attachments: build_attachment(file_name, csv_content),
    });

    return { success: true, file_name, record_count: records.length };
  } catch (err) {
    log_action('EMAIL_CSV_ERROR', `error: ${err.message}`);
    throw err;
  }
}

module.exports = email_csv_service;
