const { email_config } = require('./email_create_transporter');

function build_mail_options({ to, subject, text, html, attachments, cc } = {}) {
  const mail_options = {
    from: email_config.from,
    to: Array.isArray(to) ? to.join(', ') : (to || ''),
    subject: subject || '',
  };

  if (text) mail_options.text = text;
  if (html) mail_options.html = html;

  if (cc) {
    mail_options.cc = Array.isArray(cc) ? cc.join(', ') : cc;
  }

  if (attachments) {
    mail_options.attachments = Array.isArray(attachments) ? attachments : [attachments];
  }

  return mail_options;
}

module.exports = build_mail_options;