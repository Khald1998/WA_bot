const build_mail_options = require('./email_build_mail_options');
const send_email = require('./email_send_email');

async function send_to_recipient(transporter, config, email, file_name, csv_content, count, start_time, end_time, subject, text_body, html_body, log_action, log_prefix, cc) {
  if (log_action && log_prefix) log_action(`${log_prefix}_SEND_ATTEMPT`, `to: ${email}`);
  try {
    const mail_options = build_mail_options(config, email, file_name, csv_content, count, start_time, end_time, subject, text_body, html_body, cc);
    await send_email(transporter, mail_options);
    if (log_action && log_prefix) log_action(`${log_prefix}_SEND_SUCCESS`, `to: ${email}`);
    return { email, success: true };
  } catch (err) {
    if (log_action && log_prefix) log_action(`${log_prefix}_SEND_ERROR`, `to: ${email}, error: ${err.message}`);
    return { email, success: false, error: err.message };
  }
}

module.exports = send_to_recipient;
