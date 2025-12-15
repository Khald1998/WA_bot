const send_to_recipient = require('./email_send_to_recipient');

async function send_to_all_recipients(transporter, config, emails, file_name, csv_content, count, start_time, end_time, subject, text_body, html_body, log_action, log_prefix) {
  const results = [];
  for (const email of emails) {
    const result = await send_to_recipient(transporter, config, email, file_name, csv_content, count, start_time, end_time, subject, text_body, html_body, log_action, log_prefix);
    results.push(result);
  }
  return results;
}

module.exports = send_to_all_recipients;
