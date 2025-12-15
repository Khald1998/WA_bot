const nodemailer = require('nodemailer');

function create_transporter(config) {
  // Accepts both service-based and host/port-based configs
  if (config.service) {
    return nodemailer.createTransport({
      service: config.service,
      auth: {
        user: config.user,
        pass: config.pass
      }
    });
  } else {
    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass
      }
    });
  }
}

module.exports = create_transporter;
