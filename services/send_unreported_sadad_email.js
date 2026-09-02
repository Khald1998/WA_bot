// Sends the "unreported SADAD" email: emails every is_reported=0 sadad, then
// marks the emailed records reported.
//
// Sends are serialized (one at a time) so two near-simultaneous triggers can't
// both read the same unreported sadad before either marks it reported — which
// would email the same sadad to the bank twice.

const email_service = require('./email_service');
const { log_action } = require('../debug/logger');
const get_unreported_sadads = require('../getters/get_unreported_sadads');
const get_sadads_by_time = require('../getters/get_sadads_by_time');
const generate_sadad_txt = require('../generate_report/generate_sadad_txt');
const archive_attachment = require('./archive_attachment');
const mark_sadads_as_reported = require('../db/utility/mark_sadads_as_reported');

const escape_html = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function build_body(records) {
  const total = records.length;

  const text_lines = ['Unreported SADAD Records', `Total: ${total}`, ''];
  records.forEach((r, i) => {
    text_lines.push(
      `Record ${i + 1}`,
      `sadad_number: ${r.sadad_number ?? ''}`,
      `sadad_type: ${r.sadad_type ?? ''}`,
      `original_text: ${r.original_text ?? ''}`,
      `created_at: ${r.created_at ?? ''}`,
      ''
    );
  });

  const html_records = records.map((r, i) => `
    <div style="border:1px solid #ddd;padding:12px;margin:8px 0;border-radius:6px;">
      <strong>Record ${i + 1}</strong><br>
      <strong>sadad_number:</strong> ${escape_html(r.sadad_number)}<br>
      <strong>sadad_type:</strong> ${escape_html(r.sadad_type)}<br>
      <strong>original_text:</strong> ${escape_html(r.original_text)}<br>
      <strong>created_at:</strong> ${escape_html(r.created_at)}
    </div>`).join('');

  const html = `<h2>Unreported SADAD Records</h2><p><strong>Total:</strong> ${total}</p><hr>${html_records}`;

  return { text: text_lines.join('\n'), html };
}

// Mutex: each call waits for the previous to finish before taking the slot.
let queue = Promise.resolve();
async function send_unreported_sadad_email(to, cc, subject) {
  const previous = queue;
  let release;
  queue = new Promise(r => { release = r; });
  try {
    await previous;

    const records = await get_unreported_sadads();
    log_action('EMAIL_SADAD_RAW_QUERY_SUCCESS', `Found ${records.length} unreported SADAD`);

    if (records.length === 0) {
      log_action('EMAIL_SADAD_RAW_NO_DATA', 'No unreported SADAD found');
      return { success: false, message: 'No unreported SADAD found' };
    }

    const { text, html } = build_body(records);

    // Attachment = every SADAD spotted today (KSA) as "<bill>,<type>," per line —
    // a running daily list, mirroring the IBAN email's .txt attachment.
    const ksa_now = new Date(Date.now() + 3 * 3600 * 1000);
    const y = ksa_now.getUTCFullYear();
    const m = String(ksa_now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(ksa_now.getUTCDate()).padStart(2, '0');
    const start_of_day = `${y}-${m}-${d}T00:00:00.000+03:00`;
    const end_of_day = `${y}-${m}-${d}T23:59:59.999+03:00`;
    const today_records = await get_sadads_by_time(start_of_day, end_of_day);
    log_action('EMAIL_SADAD_RAW_TODAY_QUERY', `Found ${today_records.length} SADAD inserted today`);

    const txt_content = generate_sadad_txt(today_records);
    const h = String(ksa_now.getUTCHours()).padStart(2, '0');
    const min = String(ksa_now.getUTCMinutes()).padStart(2, '0');
    const s = String(ksa_now.getUTCSeconds()).padStart(2, '0');
    const file_name = `SADAD_${y}-${m}-${d}_${h}-${min}-${s}.txt`;

    const subject_with_count = `${subject} (${records.length})`;

    // Archive the exact attachment bytes before sending (audit trail).
    archive_attachment(file_name, txt_content, to, cc, records.length, 'SADAD');

    await email_service(to, cc, subject_with_count, text, html, file_name, txt_content);

    const mark_result = await mark_sadads_as_reported(records.map(r => r.id));
    log_action('EMAIL_SADAD_RAW_MARK_REPORTED', `Marked ${mark_result.changes} SADAD as reported`);

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

module.exports = send_unreported_sadad_email;
