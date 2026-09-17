const express = require('express');                 // load the express framework
const router = express.Router();                    // create a new express router
const { log_action } = require('../debug/logger');  // import the action logger helper
const get_phones_by_time = require('../getters/get_phones_by_time');  // import the phones-by-time getter

module.exports = () => {                             // export a router factory function
  router.get('/phones', async (req, res) => {        // register the GET /phones route
    const { start_time, end_time } = req.query;      // pull the time-window params from the query string

    if (!start_time || !end_time) {                  // require both time-window params
      return res.status(400).json({                  // respond 400 when a param is missing
        error: 'Query params "start_time" and "end_time" are required (ISO datetime).'  // error message returned when a param is missing
      });                                            // end the 400 JSON body
    }                                                // end missing-param guard

    try {                                            // guard the DB fetch
      log_action('API_GET_PHONES_ATTEMPT', `start_time: ${start_time}, end_time: ${end_time}`);  // log the fetch attempt
      const records = await get_phones_by_time(start_time, end_time);  // query phones within the time window
      log_action('API_GET_PHONES_SUCCESS', `Found ${records.length} records`);  // log how many records were found
      return res.json({ success: true, count: records.length, records });  // return the records as JSON
    } catch (err) {                                  // handle any fetch failure
      log_action('API_GET_PHONES_ERROR', err.message);  // log the error message
      return res.status(500).json({ error: 'Failed to fetch phones.', details: err.message });  // respond 500 with the error detail
    }                                                // end catch block
  });                                                // end route handler

  return router;                                     // return the configured router
};                                                   // end router factory
