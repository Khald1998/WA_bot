async function send_email(transporter, mail_options) {
  await transporter.sendMail(mail_options);
}

module.exports = send_email;
