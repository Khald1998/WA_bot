const express = require('express');                                            // import the Express web framework
const router = express.Router();                                               // create a new Express router instance
const email_service = require('../services/email_service');                    // load the email-sending service
const { log_action } = require('../debug/logger');                             // pull in the action logger helper

const get_sadads_by_time = require('../getters/get_sadads_by_time');           // load the SADAD time-range query
const generate_sadad_csv = require('../generate_report/generate_sadad_csv');   // load the SADAD CSV generator

module.exports = () => {                                                       // export a factory that builds the router
  router.post('/email-csv-sadad', async (req, res) => {                        // handle POST requests to email a SADAD CSV
    const { start_time, end_time, to, cc, subject, text_body, html_body } = req.body;  // destructure the request body fields

    if (                                                                       // begin validation of required fields
      !start_time || !end_time ||                                              // require both start and end times
      !to || !Array.isArray(to) || to.length === 0 ||                          // require a non-empty "to" array
      !cc || !Array.isArray(cc) || cc.length === 0 ||                          // require a non-empty "cc" array
      !subject || !text_body || !html_body                                     // require subject and both bodies
    ) {                                                                        // end of the validation condition
      log_action('API_EMAIL_CSV_SADAD_ATTEMPT', 'Missing required fields');    // log the failed attempt
      return res.status(400).json({                                           // respond with 400 Bad Request as JSON
        error: 'Request body must contain "start_time", "end_time", "to" (array), "cc" (array), "subject", "text_body", and "html_body" fields.'  // explain which fields are required
      });                                                                      // end the 400 response payload
    }                                                                          // end the validation block

    try {                                                                      // begin main processing block
      log_action('API_EMAIL_CSV_SADAD_QUERY_ATTEMPT', `start_time: ${start_time}, end_time: ${end_time}`);  // log the query attempt with the time range
      const records = await get_sadads_by_time(start_time, end_time);          // fetch SADAD records within the range
      log_action('API_EMAIL_CSV_SADAD_QUERY_SUCCESS', `Found ${records.length} records`);  // log how many records were found

      if (records.length === 0) {                                              // if no records matched the range
        log_action('API_EMAIL_CSV_SADAD_NO_DATA', 'No records found in the specified time range');  // log the empty result
        return res.json({ success: false, message: 'No records found in the specified time range' });  // return an empty-result response
      }                                                                        // end the empty-result branch

      const csv_content = generate_sadad_csv(records);                         // build the CSV text from the records
      log_action('API_EMAIL_CSV_SADAD_GENERATED', `CSV size: ${csv_content.length} bytes`);  // log the generated CSV size

      const file_name = `SADAD_${start_time.replace(/:/g, '-')}_to_${end_time.replace(/:/g, '-')}.csv`;  // build a safe CSV filename from the range

      await email_service(                                                     // send the CSV via email
        to, cc,                                                                // pass the recipient and cc lists
        subject, text_body, html_body,                                         // pass the subject and both message bodies
        file_name, csv_content                                                 // pass the attachment name and its contents
      );                                                                       // end the email_service call
      return res.json({ success: true, record_count: records.length });        // return a success response with the count
    } catch (err) {                                                            // catch any error during processing
      log_action('API_EMAIL_CSV_SADAD_ERROR', err.message);                    // log the error message
      return res.status(500).json({                                           // respond with 500 Internal Server Error as JSON
        error: 'Failed to email SADAD CSV. See server logs for details.',      // generic client-facing error message
        details: err.message                                                   // include the underlying error detail
      });                                                                      // end the 500 response payload
    }                                                                          // end the try/catch block
  });                                                                          // end the POST route handler

  return router;                                                               // return the configured router
};                                                                             // end the exported factory function
