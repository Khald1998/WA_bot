const SERVICE_FILE_NAME = 'services/email_national_id_csv_service.js';
const FUNCTION_NAME = 'email_national_id_csv_service';

const { log_action } = require('../debug/logger');
const nodemailer = require('nodemailer');
const generate_national_id_csv = require('../generate_report/generate_national_id_csv');
const get_national_ids_by_time = require('../getters/get_national_ids_by_time');


function generate_filename(start_time, end_time) {
  const sanitize = (t) => t.replace(/:/g, '-');
  return `national_ids_${sanitize(start_time)}_to_${sanitize(end_time)}.csv`;
}

function create_transporter(config) {
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

function build_subject(start_time, end_time) {
  return `National IDs Export - ${start_time} to ${end_time}`;
}

function build_text_body(start_time, end_time, count) {
  return `National IDs Export\nPeriod: ${start_time} to ${end_time}\nTotal records: ${count}`;
}

function build_html_body(start_time, end_time, count) {
  return `
    <h3>National IDs Export</h3>
    <p><strong>Period:</strong> ${start_time} to ${end_time}</p>
    <p><strong>Total records:</strong> ${count}</p>
  `;
}

function build_attachment(file_name, csv_content) {
  return {
    filename: file_name,
    content: csv_content,
    contentType: 'text/csv'
  };
}

function build_mail_options(config, email, file_name, csv_content, count, start_time, end_time, cc) {
  const mail_options = {
    from: config.from,
    to: email,
    subject: build_subject(start_time, end_time),
    text: build_text_body(start_time, end_time, count),
    html: build_html_body(start_time, end_time, count),
    attachments: [build_attachment(file_name, csv_content)]
  };
  
  if (cc && Array.isArray(cc) && cc.length > 0) {
    mail_options.cc = cc.join(', ');
  }
  
  return mail_options;
}

async function send_email(transporter, mail_options) {
  await transporter.sendMail(mail_options);
}

async function send_to_recipient(transporter, config, email, file_name, csv_content, count, start_time, end_time, cc) {
  log_action('EMAIL_NATIONAL_ID_CSV_SEND_ATTEMPT', `to: ${email}`);

  try {
    const mail_options = build_mail_options(config, email, file_name, csv_content, count, start_time, end_time, cc);
    await send_email(transporter, mail_options);
    log_action('EMAIL_NATIONAL_ID_CSV_SEND_SUCCESS', `to: ${email}`);
    return { email, success: true };
  } catch (err) {
    log_action('EMAIL_NATIONAL_ID_CSV_SEND_ERROR', `to: ${email}, error: ${err.message}`);
    return { email, success: false, error: err.message };
  }
}

async function send_to_all_recipients(transporter, config, to, file_name, csv_content, count, start_time, end_time, cc) {
  const results = [];

  for (const email of to) {
    const result = await send_to_recipient(transporter, config, email, file_name, csv_content, count, start_time, end_time, cc);
    results.push(result);
  }

  return results;
}

async function email_national_id_csv_service(email_config, start_time, end_time, to, cc) {
  try {
    log_action('EMAIL_NATIONAL_ID_CSV_QUERY_ATTEMPT', `start_time: ${start_time}, end_time: ${end_time}`);

    const national_ids = await get_national_ids_by_time(start_time, end_time);
    log_action('EMAIL_NATIONAL_ID_CSV_QUERY_SUCCESS', `Found ${national_ids.length} national IDs`);

    if (national_ids.length === 0) {
      log_action('EMAIL_NATIONAL_ID_CSV_NO_DATA', 'No national IDs found in the specified time range');
      return { success: false, message: 'No national IDs found in the specified time range' };
    }

    const csv_content = generate_national_id_csv(national_ids);
    log_action('EMAIL_NATIONAL_ID_CSV_GENERATED', `CSV size: ${csv_content.length} bytes`);

    const file_name = generate_filename(start_time, end_time);
    const transporter = create_transporter(email_config);

    const results = await send_to_all_recipients(
      transporter,
      email_config,
      to,
      file_name,
      csv_content,
      national_ids.length,
      start_time,
      end_time,
      cc
    );

    return {
      success: true,
      file_name,
      record_count: national_ids.length,
      sent_to: results
    };

  } catch (err) {
    log_action('EMAIL_NATIONAL_ID_CSV_ERROR', `error: ${err.message}`);
    throw err;
  }
}

module.exports = email_national_id_csv_service;