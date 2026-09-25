
const email_service = require('./email_service');                               // helper that actually sends the email; module sends the "unreported National ID" email: emails every is_reported=0 national_id, then marks the emailed records reported; sends are serialized (one at a time) so two near-simultaneous triggers can't both read the same unreported national_id before either marks it reported — which would email the same national_id to the bank twice
const { log_action } = require('../debug/logger');                              // structured action logger
const get_unreported_national_ids = require('../db/getters/get_unreported_national_ids');   // fetch is_reported=0 national IDs
const mark_national_ids_as_reported = require('../db/utility/mark_national_ids_as_reported');   // flag rows as reported

const escape_html = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));   // HTML-escape a value for safe email markup

function build_body(records) {                                                  // build plain-text and HTML email bodies
  const total = records.length;                                                 // count of records being emailed

  const text_lines = ['Unreported National ID Records', `Total: ${total}`, ''];  // seed the plain-text lines with a header
  records.forEach((r, i) => {                                                    // append each record to the text body
    text_lines.push(                                                            // push this record's lines
      `Record ${i + 1}`,                                                        // record number header
      `national_id_number: ${r.national_id_number ?? ''}`,                      // the national ID value
      `original_text: ${r.original_text ?? ''}`,                                // the source text it came from
      `created_at: ${r.created_at ?? ''}`,                                      // when the record was created
      ''                                                                        // blank spacer line between records
    );                                                                          // end push call
  });                                                                           // end forEach

  const html_records = records.map((r, i) => `
    <div style="border:1px solid #ddd;padding:12px;margin:8px 0;border-radius:6px;">
      <strong>Record ${i + 1}</strong><br>
      <strong>national_id_number:</strong> ${escape_html(r.national_id_number)}<br>
      <strong>original_text:</strong> ${escape_html(r.original_text)}<br>
      <strong>created_at:</strong> ${escape_html(r.created_at)}
    </div>`).join('');                                                          // render each record as an HTML card and join

  const html = `<h2>Unreported National ID Records</h2><p><strong>Total:</strong> ${total}</p><hr>${html_records}`;   // wrap cards with heading and total

  return { text: text_lines.join('\n'), html };                                 // return both body variants
}                                                                               // end build_body

let queue = Promise.resolve();                                                  // shared tail of the serialization chain; mutex: each call waits for the previous to finish before taking the slot
async function send_unreported_national_id_email(to, cc, subject) {             // email + mark unreported IDs, one call at a time
  const previous = queue;                                                       // capture the current chain tail to wait on
  let release;                                                                  // will hold this call's completion signal
  queue = new Promise(r => { release = r; });                                   // install a new tail others will wait on
  try {                                                                         // run the critical section
    await previous;                                                             // wait until the prior call has finished

    const records = await get_unreported_national_ids();                        // load all unreported national IDs
    log_action('EMAIL_NATIONAL_ID_RAW_QUERY_SUCCESS', `Found ${records.length} unreported National ID`);   // log how many were found

    if (records.length === 0) {                                                 // nothing to report
      log_action('EMAIL_NATIONAL_ID_RAW_NO_DATA', 'No unreported National ID found');   // log the empty result
      return { success: false, message: 'No unreported National ID found' };   // return that there is nothing to send
    }                                                                           // end empty-result branch

    const { text, html } = build_body(records);                                 // build the two email bodies
    const subject_with_count = `${subject} (${records.length})`;                // append the record count to the subject
    await email_service(to, cc, subject_with_count, text, html);                // send the email

    const mark_result = await mark_national_ids_as_reported(records.map(r => r.id));   // mark the emailed rows as reported
    log_action('EMAIL_NATIONAL_ID_RAW_MARK_REPORTED', `Marked ${mark_result.changes} National ID as reported`);   // log how many were marked

    return {                                                                    // return a success summary
      success: true,                                                            // operation succeeded
      record_count: records.length,                                             // number of records emailed
      marked_as_reported: mark_result.changes,                                  // number of rows marked reported
      sent_to: to,                                                              // echo the "to" recipients
      cc                                                                        // echo the "cc" recipients
    };                                                                          // end summary object
  } finally {                                                                   // always release the mutex slot
    release();                                                                  // let the next queued call proceed
  }                                                                             // end finally
}                                                                               // end send_unreported_national_id_email

module.exports = send_unreported_national_id_email;                             // export the serialized email sender
