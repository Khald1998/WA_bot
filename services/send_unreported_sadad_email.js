const email_service = require('./email_service');  // load the email-sending service; module sends the "unreported SADAD" email: emails every is_reported=0 sadad then marks the emailed records reported; sends are serialized (one at a time) so two near-simultaneous triggers can't both read the same unreported sadad before either marks it reported — which would email the same sadad to the bank twice
const { log_action } = require('../debug/logger');  // load the action logger
const get_unreported_sadads = require('../getters/get_unreported_sadads');  // getter for unreported SADAD rows
const get_sadads_by_time = require('../getters/get_sadads_by_time');  // getter for SADAD rows within a time range
const generate_sadad_txt = require('../generate_report/generate_sadad_txt');  // builds the SADAD .txt report
const archive_attachment = require('./archive_attachment');  // archives the sent attachment for audit
const mark_sadads_as_reported = require('../db/utility/mark_sadads_as_reported');  // flags SADAD rows as reported

const escape_html = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));  // escape HTML-special chars for safe embedding

function build_body(records) {  // build the plain-text and HTML email bodies
  const total = records.length;  // total number of records

  const text_lines = ['Unreported SADAD Records', `Total: ${total}`, ''];  // seed the text body lines
  records.forEach((r, i) => {  // append each record's fields to the text body
    text_lines.push(  // push this record's lines
      `Record ${i + 1}`,  // record header with 1-based index
      `sadad_number: ${r.sadad_number ?? ''}`,  // the SADAD bill number
      `sadad_type: ${r.sadad_type ?? ''}`,  // the SADAD type code
      `original_text: ${r.original_text ?? ''}`,  // the raw source message text
      `created_at: ${r.created_at ?? ''}`,  // the insertion timestamp
      ''  // blank separator line
    );  // end push
  });  // end forEach

  const html_records = records.map((r, i) => `
    <div style="border:1px solid #ddd;padding:12px;margin:8px 0;border-radius:6px;">
      <strong>Record ${i + 1}</strong><br>
      <strong>sadad_number:</strong> ${escape_html(r.sadad_number)}<br>
      <strong>sadad_type:</strong> ${escape_html(r.sadad_type)}<br>
      <strong>original_text:</strong> ${escape_html(r.original_text)}<br>
      <strong>created_at:</strong> ${escape_html(r.created_at)}
    </div>`).join('');  // close the HTML template and join all record blocks

  const html = `<h2>Unreported SADAD Records</h2><p><strong>Total:</strong> ${total}</p><hr>${html_records}`;  // assemble the full HTML body

  return { text: text_lines.join('\n'), html };  // return joined text body and HTML body
}  // end build_body

let queue = Promise.resolve();  // mutex chain tail, initially resolved; each call waits for the previous to finish before taking the slot
async function send_unreported_sadad_email(to, cc, subject) {  // send the unreported-SADAD email
  const previous = queue;  // capture the current tail of the mutex chain
  let release;  // will hold this call's release function
  queue = new Promise(r => { release = r; });  // extend the chain with our own promise
  try {  // begin the serialized critical section
    await previous;  // wait for the previous send to finish

    const records = await get_unreported_sadads();  // fetch all unreported SADAD rows
    log_action('EMAIL_SADAD_RAW_QUERY_SUCCESS', `Found ${records.length} unreported SADAD`);  // log how many were found

    if (records.length === 0) {  // nothing to report
      log_action('EMAIL_SADAD_RAW_NO_DATA', 'No unreported SADAD found');  // log the empty result
      return { success: false, message: 'No unreported SADAD found' };  // bail out early
    }  // end empty-records check

    const { text, html } = build_body(records);  // build the email bodies

    const ksa_now = new Date(Date.now() + 3 * 3600 * 1000);  // now shifted to KSA time (UTC+3); attachment = every SADAD spotted today (KSA) as "<bill>,<type>," per line — a running daily list, mirroring the IBAN email's .txt attachment
    const y = ksa_now.getUTCFullYear();  // KSA year
    const m = String(ksa_now.getUTCMonth() + 1).padStart(2, '0');  // KSA month, zero-padded
    const d = String(ksa_now.getUTCDate()).padStart(2, '0');  // KSA day, zero-padded
    const start_of_day = `${y}-${m}-${d}T00:00:00.000+03:00`;  // KSA start-of-day ISO timestamp
    const end_of_day = `${y}-${m}-${d}T23:59:59.999+03:00`;  // KSA end-of-day ISO timestamp
    const today_records = await get_sadads_by_time(start_of_day, end_of_day);  // fetch all SADAD inserted today
    log_action('EMAIL_SADAD_RAW_TODAY_QUERY', `Found ${today_records.length} SADAD inserted today`);  // log today's count

    const txt_content = generate_sadad_txt(today_records);  // build the .txt attachment content
    const h = String(ksa_now.getUTCHours()).padStart(2, '0');  // KSA hour, zero-padded
    const min = String(ksa_now.getUTCMinutes()).padStart(2, '0');  // KSA minute, zero-padded
    const s = String(ksa_now.getUTCSeconds()).padStart(2, '0');  // KSA second, zero-padded
    const file_name = `SADAD_${y}-${m}-${d}_${h}-${min}-${s}.txt`;  // timestamped attachment filename

    const subject_with_count = `${subject} (${records.length})`;  // append the record count to the subject

    archive_attachment(file_name, txt_content, to, cc, records.length, 'SADAD');  // archive the exact attachment bytes before sending (audit trail)

    await email_service(to, cc, subject_with_count, text, html, file_name, txt_content);  // send the email with attachment

    const mark_result = await mark_sadads_as_reported(records.map(r => r.id));  // mark the emailed rows as reported
    log_action('EMAIL_SADAD_RAW_MARK_REPORTED', `Marked ${mark_result.changes} SADAD as reported`);  // log how many were marked

    return {  // return the send summary
      success: true,  // send succeeded
      record_count: records.length,  // number of records emailed
      marked_as_reported: mark_result.changes,  // number of rows marked reported
      sent_to: to,  // primary recipient
      cc  // cc recipients
    };  // end return object
  } finally {  // always run whether or not send threw
    release();  // release the mutex slot for the next caller
  }  // end try/finally
}  // end send_unreported_sadad_email

module.exports = send_unreported_sadad_email;  // export the sender function
