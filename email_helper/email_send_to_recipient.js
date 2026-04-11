const build_mail_options = require('./email_build_mail_options');
const send_email = require('./email_send_email');

async function send_to_recipient(transporter, config, email, file_name, csv_content, count, start_time, end_time, subject, text_body, html_body, cc) {
  try {
    const mail_options = build_mail_options(config, email, file_name, csv_content, count, start_time, end_time, subject, text_body, html_body, cc);
    await send_email(transporter, mail_options);
    return { email, success: true };
  } catch (err) {
    return { email, success: false, error: err.message };
  }
}

module.exports = send_to_recipient;
