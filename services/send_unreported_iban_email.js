const email_service = require('./email_service');  // email sender that delivers the message + attachment. module: sends the "unreported IBAN" email: emails every is_reported=0 IBAN, attaches today's IBANs as a .txt, then marks the emailed records reported. called directly from the message listener (handle_iban). sends are serialized (one at a time) so two near-simultaneous triggers can't both read the same unreported IBAN before either marks it reported — which would email the same IBAN to the bank twice
const { log_action } = require('../debug/logger');  // structured action logger
const get_unreported_ibans = require('../getters/get_unreported_IBANs');  // fetch IBANs with is_reported=0
const get_ibans_by_time = require('../getters/get_ibans_by_time');  // fetch IBANs within a time range
const generate_iban_txt = require('../generate_report/generate_iban_txt');  // render IBAN records into .txt text
const mark_ibans_as_reported = require('../db/utility/mark_ibans_as_reported');  // flip records to is_reported=1
const archive_attachment = require('./archive_attachment');  // save a copy of the sent attachment

const escape_html = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));  // HTML-escape a value for safe embedding

function build_body(records) {  // build the text + html email bodies from records
  const total = records.length;  // count of records to report

  const text_lines = ['Unreported IBAN Records', `Total: ${total}`, ''];  // seed the plain-text lines with a header
  records.forEach((r, i) => {  // append a plain-text block per record
    text_lines.push(  // push this record's lines
      `Record ${i + 1}`,  // record heading (1-based index)
      `iban_number: ${r.iban_number ?? ''}`,  // the IBAN value, blank if null
      `original_text: ${r.original_text ?? ''}`,  // the source text it was parsed from
      `created_at: ${r.created_at ?? ''}`,  // insertion timestamp
      ''  // blank spacer line between records
    );  // end push call
  });  // end forEach

  const html_records = records.map((r, i) => `
    <div style="border:1px solid #ddd;padding:12px;margin:8px 0;border-radius:6px;">
      <strong>Record ${i + 1}</strong><br>
      <strong>iban_number:</strong> ${escape_html(r.iban_number)}<br>
      <strong>original_text:</strong> ${escape_html(r.original_text)}<br>
      <strong>created_at:</strong> ${escape_html(r.created_at)}
    </div>`).join('');  // close the per-record template and join all record blocks

  const html = `<h2>Unreported IBAN Records</h2><p><strong>Total:</strong> ${total}</p><hr>${html_records}`;  // assemble the full HTML body

  return { text: text_lines.join('\n'), html };  // return joined text body and html body
}  // end build_body

let queue = Promise.resolve();  // mutex chain; starts already resolved — mutex: each call waits for the previous to finish before taking the slot
async function send_unreported_iban_email(to, cc, subject) {  // send + mark unreported IBANs, serialized
  const previous = queue;  // capture the currently pending tail of the chain
  let release;  // will hold this call's resolve function
  queue = new Promise(r => { release = r; });  // install a new tail others must wait on
  try {  // guard so the slot is always released
    await previous;  // wait for any earlier send to finish first

    const records = await get_unreported_ibans();  // load all is_reported=0 IBANs
    log_action('EMAIL_IBAN_RAW_QUERY_SUCCESS', `Found ${records.length} unreported IBAN`);  // log how many were found

    if (records.length === 0) {  // nothing to report
      log_action('EMAIL_IBAN_RAW_NO_DATA', 'No unreported IBAN found');  // log the empty result
      return { success: false, message: 'No unreported IBAN found' };  // bail out early
    }  // end empty-check

    const { text, html } = build_body(records);  // build both email body formats

    const ksa_now = new Date(Date.now() + 3 * 3600 * 1000);  // current time shifted to KSA (UTC+3)
    const y = ksa_now.getUTCFullYear();  // KSA year
    const m = String(ksa_now.getUTCMonth() + 1).padStart(2, '0');  // KSA month, zero-padded
    const d = String(ksa_now.getUTCDate()).padStart(2, '0');  // KSA day, zero-padded

    const start_of_day = `${y}-${m}-${d}T00:00:00.000+03:00`;  // KSA midnight start bound; the attachment is a running daily list: every IBAN spotted today (KSA), reported or not, so the latest file is the complete day-so-far
    const end_of_day = `${y}-${m}-${d}T23:59:59.999+03:00`;  // KSA end-of-day bound
    const today_records = await get_ibans_by_time(start_of_day, end_of_day);  // all IBANs inserted today
    log_action('EMAIL_IBAN_RAW_TODAY_QUERY', `Found ${today_records.length} IBAN inserted today`);  // log today's count

    const txt_content = generate_iban_txt(today_records);  // render today's IBANs into .txt content
    const h = String(ksa_now.getUTCHours()).padStart(2, '0');  // KSA hour, zero-padded
    const min = String(ksa_now.getUTCMinutes()).padStart(2, '0');  // KSA minute, zero-padded
    const s = String(ksa_now.getUTCSeconds()).padStart(2, '0');  // KSA second, zero-padded
    const file_name = `IBAN_${y}-${m}-${d}_${h}-${min}-${s}.txt`;  // timestamped attachment filename

    const subject_with_count = `${subject} (${records.length})`;  // append the record count to the subject

    archive_attachment(file_name, txt_content, to, cc, records.length);  // save a local copy of the attachment

    await email_service(to, cc, subject_with_count, text, html, file_name, txt_content);  // send the email

    const mark_result = await mark_ibans_as_reported(records.map(r => r.id));  // mark the emailed IBANs reported
    log_action('EMAIL_IBAN_RAW_MARK_REPORTED', `Marked ${mark_result.changes} IBAN as reported`);  // log the update count

    return {  // report success back to the caller
      success: true,  // operation succeeded
      record_count: records.length,  // how many IBANs were emailed
      marked_as_reported: mark_result.changes,  // how many rows were flipped to reported
      sent_to: to,  // primary recipient(s)
      cc  // carbon-copy recipient(s)
    };  // end return object
  } finally {  // always runs, success or throw
    release();  // free the mutex slot for the next call
  }  // end finally
}  // end send_unreported_iban_email

module.exports = send_unreported_iban_email;  // export the sender function
