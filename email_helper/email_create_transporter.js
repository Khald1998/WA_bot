const nodemailer = require('nodemailer');

const email_config = {
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS,
  from: process.env.EMAIL_FROM,
};

function create_transporter() {
  return nodemailer.createTransport({
    service: email_config.service,
    auth: {
      user: email_config.user,
      pass: email_config.pass,
    },
  });
}

module.exports = { create_transporter, email_config };
