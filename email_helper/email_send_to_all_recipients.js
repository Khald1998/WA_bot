const send_to_recipient = require('./email_send_to_recipient');

async function send_to_all_recipients(transporter, config, emails, file_name, csv_content, subject, text_body, html_body, cc) {
  const results = [];
  for (const email of emails) {
    const result = await send_to_recipient(transporter, config, email, file_name, csv_content, subject, text_body, html_body, cc);
    results.push(result);
  }
  return results;
}

module.exports = send_to_all_recipients;
