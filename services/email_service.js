const { log_action } = require('../debug/logger');
const { create_transporter } = require('../email_helper/email_create_transporter');
const send_email = require('../email_helper/email_send_to_recipient');
const build_attachment = require('../email_helper/email_build_attachment');

async function email_service(to, cc, subject, text_body, html_body, file_name, content) {
  try {
    const transporter = create_transporter();

    const mail = {
      to, cc,
      subject,
      text: text_body,
      html: html_body,
    };

    if (file_name && content) {
      mail.attachments = build_attachment(file_name, content);
    }

    await send_email(transporter, mail);

    return true;
  } catch (err) {
    log_action('EMAIL_ERROR', `error: ${err.message}`);
    throw err;
  }
}

module.exports = email_service;