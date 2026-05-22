// Event-driven version of run_email_iban_raw.sh: parse the latest logs into
// evidence, then email any unreported IBANs right away. Triggered from the
// message listener when a new message contains an IBAN, instead of waiting for
// the cron tick. send_unreported_iban_email is internally serialized, so the
// "mark as reported" step still guarantees each IBAN is emailed exactly once.

const { collect_evidence_data } = require('./collect_evidence_data');
const send_unreported_iban_email = require('./send_unreported_iban_email');
const { log_action } = require('../debug/logger');

// Same recipients as run_email_iban_raw.sh.
const TO = [
  'Tbinessa@saib.com.sa',
  'Alhajoojs@saib.com.sa',
  'Hajajalmutairi@saib.com.sa',
  'Aalawn@saib.com.sa',
  'Aalsuwayri@saib.com.sa',
  'kalzahrani@saib.com.sa',
  'h.almutairi@saib.com.sa',
  'abdulazizalrayes@saib.com.sa',
  'a.alshebl@saib.com.sa',
  'm.alanazi@saib.com.sa',
  'oalharbi@saib.com.sa'
];
const CC = [
  'aalasmari@saib.com.sa',
  'Analshammari@saib.com.sa',
  'Alharbif@saib.com.sa'
];
const SUBJECT = 'Unreported IBAN';

async function report_new_iban() {
  await collect_evidence_data();
  const result = await send_unreported_iban_email(TO, CC, SUBJECT);
  log_action('REPORT_NEW_IBAN', JSON.stringify(result));
  return result;
}

module.exports = report_new_iban;
