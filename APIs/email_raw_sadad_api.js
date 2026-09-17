const express = require('express');  // load the Express framework
const router = express.Router();  // create a router for this endpoint
const email_service = require('../services/email_service');  // load the email-sending service
const { log_action } = require('../debug/logger');  // load the action logger

const get_unreported_sadads = require('../getters/get_unreported_sadads');  // load the unreported-SADAD getter
const mark_sadads_as_reported = require('../db/utility/mark_sadads_as_reported');  // load the mark-as-reported helper

const escape_html = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));  // escape HTML-special characters for safe email rendering

function build_body(records) {  // build the plaintext and HTML email bodies from records
  const total = records.length;  // count the records

  const text_lines = ['Unreported SADAD Records', `Total: ${total}`, ''];  // seed plaintext lines with header, total, and blank line
  records.forEach((r, i) => {  // append a plaintext block for each record
    text_lines.push(  // push this record's field lines
      `Record ${i + 1}`,  // record index heading
      `sadad_number: ${r.sadad_number ?? ''}`,  // the SADAD number field
      `sadad_type: ${r.sadad_type ?? ''}`,  // the SADAD type field
      `original_text: ${r.original_text ?? ''}`,  // the original message text
      `created_at: ${r.created_at ?? ''}`,  // the creation timestamp
      ''  // blank separator line between records
    );  // end push call
  });  // end forEach loop

  const html_records = records.map((r, i) => `
    <div style="border:1px solid #ddd;padding:12px;margin:8px 0;border-radius:6px;">
      <strong>Record ${i + 1}</strong><br>
      <strong>sadad_number:</strong> ${escape_html(r.sadad_number)}<br>
      <strong>sadad_type:</strong> ${escape_html(r.sadad_type)}<br>
      <strong>original_text:</strong> ${escape_html(r.original_text)}<br>
      <strong>created_at:</strong> ${escape_html(r.created_at)}
    </div>`).join('');  // close the template literal and join all record blocks

  const html = `<h2>Unreported SADAD Records</h2><p><strong>Total:</strong> ${total}</p><hr>${html_records}`;  // assemble the full HTML email body

  return { text: text_lines.join('\n'), html };  // return both the plaintext and HTML bodies
}  // end build_body

module.exports = () => {  // export a factory that wires and returns the route
  router.post('/email-raw-sadad', async (req, res) => {  // handle POST requests to email raw SADAD
    const { to, cc, subject } = req.body;  // pull recipients and subject from the request body

    if (  // validate the required request fields
      !to || !Array.isArray(to) || to.length === 0 ||  // "to" must be a non-empty array
      !cc || !Array.isArray(cc) || cc.length === 0 ||  // "cc" must be a non-empty array
      !subject  // "subject" must be present
    ) {  // if any validation check failed
      log_action('API_EMAIL_RAW_SADAD_ATTEMPT', 'Missing required fields');  // log the rejected attempt
      return res.status(400).json({  // respond with 400 Bad Request
        error: 'Request body must contain "to" (array), "cc" (array), and "subject" fields.'  // explain the missing fields
      });  // end the error JSON response
    }  // end validation block

    try {  // attempt to gather records and send the email
      const records = await get_unreported_sadads();  // fetch all unreported SADAD records
      log_action('EMAIL_SADAD_RAW_QUERY_SUCCESS', `Found ${records.length} unreported SADAD`);  // log how many were found

      if (records.length === 0) {  // if there is nothing to report
        log_action('EMAIL_SADAD_RAW_NO_DATA', 'No unreported SADAD found');  // log the empty result
        return res.json({ success: false, message: 'No unreported SADAD found' });  // tell the caller nothing was sent
      }  // end empty-result branch

      const { text, html } = build_body(records);  // build the plaintext and HTML bodies
      await email_service(to, cc, subject, text, html);  // send the email

      const mark_result = await mark_sadads_as_reported(records.map(r => r.id));  // mark the sent records as reported
      log_action('EMAIL_SADAD_RAW_MARK_REPORTED', `Marked ${mark_result.changes} SADAD as reported`);  // log how many rows were marked
      return res.json({  // respond with a success summary
        success: true,  // indicate the send succeeded
        record_count: records.length,  // how many records were emailed
        marked_as_reported: mark_result.changes,  // how many rows were marked reported
        sent_to: to,  // echo back the "to" recipients
        cc  // echo back the "cc" recipients
      });  // end the success JSON response
    } catch (err) {  // handle any failure during the process
      log_action('API_EMAIL_RAW_SADAD_ERROR', err.message);  // log the error message
      return res.status(500).json({  // respond with 500 Internal Server Error
        error: 'Failed to email unreported SADAD. See server logs for details.',  // generic client-facing error message
        details: err.message  // include the underlying error detail
      });  // end the error JSON response
    }  // end try/catch
  });  // end the route handler

  return router;  // return the configured router
};  // end the exported factory
