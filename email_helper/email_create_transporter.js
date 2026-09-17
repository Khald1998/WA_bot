const nodemailer = require('nodemailer');      // load the nodemailer library for sending email

const email_config = {      // define the shared SMTP/email configuration object
  service: 'gmail',      // use Gmail's well-known service preset
  host: 'smtp.gmail.com',      // Gmail SMTP server hostname
  port: 587,      // SMTP submission port (STARTTLS)
  secure: false,      // start unencrypted then upgrade via STARTTLS
  user: process.env.EMAIL_USER,      // SMTP login username from the environment
  pass: process.env.EMAIL_PASS,      // SMTP login password from the environment
  from: process.env.EMAIL_FROM,      // default from-address from the environment
};      // end the email config object

function create_transporter() {      // factory that builds a configured nodemailer transporter
  return nodemailer.createTransport({      // create and return the transporter
    service: email_config.service,      // use the Gmail service preset from config
    auth: {      // start the authentication credentials
      user: email_config.user,      // SMTP username from config
      pass: email_config.pass,      // SMTP password from config
    },      // end the auth credentials
  });      // end the transporter options
}      // end the create_transporter function

module.exports = { create_transporter, email_config };      // export the factory and the shared config
