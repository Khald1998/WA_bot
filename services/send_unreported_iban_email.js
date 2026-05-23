// Sends the "unreported IBAN" email: emails every is_reported=0 IBAN, attaches
// today's IBANs as a .txt, then marks the emailed records reported. Extracted from
// the /email-raw-iban route so the message listener can call it too.
//
// Sends are serialized (one at a time) so two near-simultaneous triggers can't
// both read the same unreported IBAN before either marks it reported — which
// would email the same IBAN to the bank twice.

const email_service = require('./email_service');
const { log_action } = require('../debug/logger');
const get_unreported_ibans = require('../getters/get_unreported_IBANs');
const get_ibans_by_time = require('../getters/get_ibans_by_time');
const generate_iban_txt = require('../generate_report/generate_iban_txt');
const mark_ibans_as_reported = require('../db/utility/mark_ibans_as_reported');

const escape_html = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function build_body(records) {
  const total = records.length;

  const text_lines = ['Unreported IBAN Records', `Total: ${total}`, ''];
  records.forEach((r, i) => {
    text_lines.push(
      `Record ${i + 1}`,
      `iban_number: ${r.iban_number ?? ''}`,
      `original_text: ${r.original_text ?? ''}`,
      `created_at: ${r.created_at ?? ''}`,
      ''
    );
  });

  const html_records = records.map((r, i) => `
    <div style="border:1px solid #ddd;padding:12px;margin:8px 0;border-radius:6px;">
      <strong>Record ${i + 1}</strong><br>
      <strong>iban_number:</strong> ${escape_html(r.iban_number)}<br>
      <strong>original_text:</strong> ${escape_html(r.original_text)}<br>
      <strong>created_at:</strong> ${escape_html(r.created_at)}
    </div>`).join('');

  const html = `<h2>Unreported IBAN Records</h2><p><strong>Total:</strong> ${total}</p><hr>${html_records}`;

  return { text: text_lines.join('\n'), html };
}

// Mutex: each call waits for the previous to finish before taking the slot.
let queue = Promise.resolve();
async function send_unreported_iban_email(to, cc, subject) {
  const previous = queue;
  let release;
  queue = new Promise(r => { release = r; });
  try {
    await previous;

    const records = await get_unreported_ibans();
    log_action('EMAIL_IBAN_RAW_QUERY_SUCCESS', `Found ${records.length} unreported IBAN`);

    if (records.length === 0) {
      log_action('EMAIL_IBAN_RAW_NO_DATA', 'No unreported IBAN found');
      return { success: false, message: 'No unreported IBAN found' };
    }

    const { text, html } = build_body(records);

    const ksa_now = new Date(Date.now() + 3 * 3600 * 1000);
    const y = ksa_now.getUTCFullYear();
    const m = String(ksa_now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(ksa_now.getUTCDate()).padStart(2, '0');
    const start_of_day = `${y}-${m}-${d}T00:00:00.000+03:00`;
    const end_of_day = `${y}-${m}-${d}T23:59:59.999+03:00`;
    const today_records = await get_ibans_by_time(start_of_day, end_of_day);
    log_action('EMAIL_IBAN_RAW_TODAY_QUERY', `Found ${today_records.length} IBAN inserted today`);

    const txt_content = generate_iban_txt(today_records);
    const file_name = `IBAN_${y}-${m}-${d}.txt`;

    const subject_with_count = `${subject} (${records.length})`;
    await email_service(to, cc, subject_with_count, text, html, file_name, txt_content);

    const mark_result = await mark_ibans_as_reported(records.map(r => r.id));
    log_action('EMAIL_IBAN_RAW_MARK_REPORTED', `Marked ${mark_result.changes} IBAN as reported`);

    return {
      success: true,
      record_count: records.length,
      marked_as_reported: mark_result.changes,
      sent_to: to,
      cc
    };
  } finally {
    release();
  }
}

module.exports = send_unreported_iban_email;
