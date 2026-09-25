const express = require('express');  // import the Express web framework
const router = express.Router();  // create a new Express router instance
const email_service = require('../services/email_service');  // load the email-sending service
const { log_action } = require('../debug/logger');  // load the audit-log helper

const get_national_ids_by_time = require('../db/getters/get_national_ids_by_time');  // load the query that fetches national IDs by time range
const generate_national_id_csv = require('../generate_report/generate_national_id_csv');  // load the national-ID CSV generator

module.exports = () => {  // export a factory that builds and returns the router
  router.post('/email-csv-national-id', async (req, res) => {  // handle POST requests that email a national-ID CSV
    const { start_time, end_time, to, cc, subject, text_body, html_body } = req.body;  // pull the required inputs from the request body

    if (  // begin the required-field validation check
      !start_time || !end_time ||  // require both start_time and end_time
      !to || !Array.isArray(to) || to.length === 0 ||  // require "to" to be a non-empty array
      !cc || !Array.isArray(cc) || cc.length === 0 ||  // require "cc" to be a non-empty array
      !subject || !text_body || !html_body  // require subject and both body fields
    ) {  // if any required field is missing or invalid
      log_action('API_EMAIL_CSV_NATIONAL_ID_ATTEMPT', 'Missing required fields');  // log the failed validation attempt
      return res.status(400).json({  // respond with HTTP 400 Bad Request
        error: 'Request body must contain "start_time", "end_time", "to" (array), "cc" (array), "subject", "text_body", and "html_body" fields.'  // the list of required request-body fields
      });  // end the 400 JSON error response
    }  // end the validation block

    try {  // attempt to query records, build the CSV, and email it
      log_action('API_EMAIL_CSV_NATIONAL_ID_QUERY_ATTEMPT', `start_time: ${start_time}, end_time: ${end_time}`);  // log the query attempt with the time range
      const records = await get_national_ids_by_time(start_time, end_time);  // fetch national-ID records within the time range
      log_action('API_EMAIL_CSV_NATIONAL_ID_QUERY_SUCCESS', `Found ${records.length} records`);  // log how many records were found

      if (records.length === 0) {  // handle the case where no records matched
        log_action('API_EMAIL_CSV_NATIONAL_ID_NO_DATA', 'No records found in the specified time range');  // log the empty-result condition
        return res.json({ success: false, message: 'No records found in the specified time range' });  // respond that nothing was found
      }  // end the no-records branch

      const csv_content = generate_national_id_csv(records);  // render the records into CSV text
      log_action('API_EMAIL_CSV_NATIONAL_ID_GENERATED', `CSV size: ${csv_content.length} bytes`);  // log the size of the generated CSV

      const file_name = `National_IDs_${start_time.replace(/:/g, '-')}_to_${end_time.replace(/:/g, '-')}.csv`;  // build a filename-safe CSV name from the time range

      await email_service(  // send the CSV to the recipients as an attachment
        to, cc,  // primary and cc recipient lists
        subject, text_body, html_body,  // email subject and text/HTML bodies
        file_name, csv_content  // attachment filename and CSV payload
      );  // end the email_service call
      return res.json({ success: true, record_count: records.length });  // respond with success and the record count
    } catch (err) {  // catch any error raised in the try block
      log_action('API_EMAIL_CSV_NATIONAL_ID_ERROR', err.message);  // log the error message
      return res.status(500).json({  // respond with HTTP 500 Internal Server Error
        error: 'Failed to email National IDs CSV. See server logs for details.',  // generic failure message for the client
        details: err.message  // include the specific error detail
      });  // end the 500 JSON error response
    }  // end the try/catch block
  });  // end the POST route handler

  return router;  // return the configured router to the caller
};  // end the exported factory function
