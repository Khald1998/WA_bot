const express = require('express');  // load the Express framework
const router = express.Router();  // create a new Express router
const { log_action } = require('../debug/logger');  // import the action logger
const send_unreported_iban_email = require('../services/send_unreported_iban_email');  // import the IBAN email sender

module.exports = () => {  // export a factory that builds the router
  router.post('/email-raw-iban', async (req, res) => {  // handle POST /email-raw-iban
    const { to, cc, subject } = req.body;  // pull recipients and subject from the body

    if (  // validate the required fields
      !to || !Array.isArray(to) || to.length === 0 ||  // to must be a non-empty array
      !cc || !Array.isArray(cc) || cc.length === 0 ||  // cc must be a non-empty array
      !subject  // subject must be present
    ) {  // when any field is missing/invalid
      log_action('API_EMAIL_RAW_IBAN_ATTEMPT', 'Missing required fields');  // log the failed attempt
      return res.status(400).json({  // respond 400 Bad Request
        error: 'Request body must contain "to" (array), "cc" (array), and "subject" fields.'  // error message about required fields
      });  // end the 400 JSON response
    }  // end validation guard

    try {  // attempt to send the email
      const result = await send_unreported_iban_email(to, cc, subject);  // send unreported IBANs and await the result
      return res.json(result);  // return the send result as JSON
    } catch (err) {  // on any failure
      log_action('API_EMAIL_RAW_IBAN_ERROR', err.message);  // log the error
      return res.status(500).json({  // respond 500 Internal Server Error
        error: 'Failed to email unreported IBAN. See server logs for details.',  // generic failure message
        details: err.message  // include the underlying error detail
      });  // end the 500 JSON response
    }  // end try/catch
  });  // end the route handler

  return router;  // return the configured router
};  // end the exported factory
