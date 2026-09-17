const { email_config } = require('./email_create_transporter');      // import the shared email config (holds the from-address)

function build_mail_options({ to, subject, text, html, attachments, cc } = {}) {      // build a nodemailer options object from destructured fields
  const mail_options = {      // start assembling the base mail options object
    from: email_config.from,      // set the sender address from the shared config
    to: Array.isArray(to) ? to.join(', ') : (to || ''),      // join a recipient array into a comma list, else use the string or empty
    subject: subject || '',      // set the subject, defaulting to an empty string
  };      // end the base mail options object

  if (text) mail_options.text = text;      // attach the plain-text body when one was provided
  if (html) mail_options.html = html;      // attach the HTML body when one was provided

  if (cc) {      // when cc recipients were provided
    mail_options.cc = Array.isArray(cc) ? cc.join(', ') : cc;      // join a cc array into a comma list, else use it as-is
  }      // end the cc block

  if (attachments) {      // when attachments were provided
    mail_options.attachments = Array.isArray(attachments) ? attachments : [attachments];      // normalize attachments into an array
  }      // end the attachments block

  return mail_options;      // return the fully assembled mail options
}      // end the build_mail_options function

module.exports = build_mail_options;      // export the builder as the module's default