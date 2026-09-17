const express = require('express');  // load the Express web framework
const router = express.Router();  // create a new Express router instance
const { log_action } = require('../debug/logger');  // pull in the structured action logger
const get_all_phones = require('../getters/get_all_phones');  // load the getter that reads all phone numbers

module.exports = () => {  // export a factory that builds and returns the router
  router.get('/phones/all', async (req, res) => {  // handle GET /phones/all requests
    try {  // guard the request handler against errors
      log_action('API_GET_ALL_PHONES_ATTEMPT', 'fetching all phones');  // log the start of the fetch attempt
      const records = await get_all_phones();  // fetch all phone records from the DB
      log_action('API_GET_ALL_PHONES_SUCCESS', `Found ${records.length} records`);  // log how many records were found
      return res.json(records);  // send the records back as a JSON response
    } catch (err) {  // handle any failure during the fetch
      log_action('API_GET_ALL_PHONES_ERROR', err.message);  // log the error message via the action logger
      return res.status(500).json({ error: 'Failed to fetch phones.', details: err.message });  // respond 500 with the error details
    }  // end catch block
  });  // end GET /phones/all route

  return router;  // return the configured router
};  // end exported factory
