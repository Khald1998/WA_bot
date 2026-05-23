// Sends the "unreported National ID" email: emails every is_reported=0 national_id,
// then marks the emailed records reported.
//
// Sends are serialized (one at a time) so two near-simultaneous triggers can't
// both read the same unreported national_id before either marks it reported —
// which would email the same national_id to the bank twice.

const email_service = require('./email_service');
const { log_action } = require('../debug/logger');
const get_unreported_national_ids = require('../getters/get_unreported_national_ids');
const mark_national_ids_as_reported = require('../db/utility/mark_national_ids_as_reported');

const escape_html = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function build_body(records) {
  const total = records.length;

  const text_lines = ['Unreported National ID Records', `Total: ${total}`, ''];
  records.forEach((r, i) => {
    text_lines.push(
      `Record ${i + 1}`,
      `national_id_number: ${r.national_id_number ?? ''}`,
      `original_text: ${r.original_text ?? ''}`,
      `created_at: ${r.created_at ?? ''}`,
      ''
    );
  });

  const html_records = records.map((r, i) => `
    <div style="border:1px solid #ddd;padding:12px;margin:8px 0;border-radius:6px;">
      <strong>Record ${i + 1}</strong><br>
      <strong>national_id_number:</strong> ${escape_html(r.national_id_number)}<br>
      <strong>original_text:</strong> ${escape_html(r.original_text)}<br>
      <strong>created_at:</strong> ${escape_html(r.created_at)}
    </div>`).join('');

  const html = `<h2>Unreported National ID Records</h2><p><strong>Total:</strong> ${total}</p><hr>${html_records}`;

  return { text: text_lines.join('\n'), html };
}

// Mutex: each call waits for the previous to finish before taking the slot.
let queue = Promise.resolve();
async function send_unreported_national_id_email(to, cc, subject) {
  const previous = queue;
  let release;
  queue = new Promise(r => { release = r; });
  try {
    await previous;

    const records = await get_unreported_national_ids();
    log_action('EMAIL_NATIONAL_ID_RAW_QUERY_SUCCESS', `Found ${records.length} unreported National ID`);

    if (records.length === 0) {
      log_action('EMAIL_NATIONAL_ID_RAW_NO_DATA', 'No unreported National ID found');
      return { success: false, message: 'No unreported National ID found' };
    }

    const { text, html } = build_body(records);
    const subject_with_count = `${subject} (${records.length})`;
    await email_service(to, cc, subject_with_count, text, html);

    const mark_result = await mark_national_ids_as_reported(records.map(r => r.id));
    log_action('EMAIL_NATIONAL_ID_RAW_MARK_REPORTED', `Marked ${mark_result.changes} National ID as reported`);

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

module.exports = send_unreported_national_id_email;
