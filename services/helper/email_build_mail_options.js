const build_attachment = require('./email_build_attachment');

function build_mail_options(config, email, file_name, csv_content, count, start_time, end_time, subject, text_body, html_body) {
  return {
    from: config.from,
    to: email,
    subject,
    text: text_body,
    html: html_body,
    attachments: [build_attachment(file_name, csv_content)]
  };
}

module.exports = build_mail_options;
