const build_mail_options = require('./email_build_mail_options');

async function send_email(transporter, options) {
  const mail_options = build_mail_options(options);
  await transporter.sendMail(mail_options);
}

module.exports = send_email;