const build_mail_options = require('./email_build_mail_options');  // import the mail-options builder helper

async function send_email(transporter, options) {  // send one email through the given transporter
  const mail_options = build_mail_options(options);  // build the nodemailer mail options from the inputs
  await transporter.sendMail(mail_options);  // dispatch the email and wait for it to send
}  // end send_email

module.exports = send_email;  // export the email-sending function