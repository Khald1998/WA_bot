const build_attachment = require('./email_build_attachment');

function build_mail_options(config, email, file_name, csv_content, subject, text_body, html_body, cc) {
  const mail_options = {
    from: config.from,
    to: email,
    subject,
    text: text_body,
    html: html_body,
    attachments: [build_attachment(file_name, csv_content)]
  };
  
  if (cc && Array.isArray(cc) && cc.length > 0) {
    mail_options.cc = cc.join(', ');
  }
  
  return mail_options;
}

module.exports = build_mail_options;
