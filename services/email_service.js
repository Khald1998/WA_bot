const { log_action } = require('../debug/logger');  // structured action logger
const { create_transporter } = require('../email_helper/email_create_transporter');  // builds the SMTP transporter
const send_email = require('../email_helper/email_send_to_recipient');  // sends a mail object via the transporter
const build_attachment = require('../email_helper/email_build_attachment');  // builds a nodemailer attachment

async function email_service(to, cc, subject, text_body, html_body, file_name, content) {  // send an email, optionally with an attachment
  try {  // attempt to build and send the message
    const transporter = create_transporter();  // create the configured SMTP transporter

    const mail = {  // assemble the mail options object
      to, cc,  // primary and carbon-copy recipients
      subject,  // email subject line
      text: text_body,  // plain-text body
      html: html_body,  // HTML body
    };  // end mail options object

    if (file_name && content) {  // only attach when both a name and content are given
      mail.attachments = build_attachment(file_name, content);  // build and attach the file
    }  // end attachment guard

    await send_email(transporter, mail);  // send the assembled email

    return true;  // signal successful send
  } catch (err) {  // handle any send failure
    log_action('EMAIL_ERROR', `error: ${err.message}`);  // log the email error
    throw err;  // re-throw so the caller can handle it
  }  // end try/catch
}  // end email_service

module.exports = email_service;  // export the email service function