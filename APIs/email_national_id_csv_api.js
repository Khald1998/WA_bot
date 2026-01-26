// Responsible for handling the /email-national-id-csv API endpoint and delegating to the email_national_id_csv_service

const express = require('express');
const router = express.Router();
const email_national_id_csv_service = require('../services/email_national_id_csv_service');
const { log_action } = require('../debug/logger');

module.exports = () => {
  // POST /email-national-id-csv
  router.post('/email-national-id-csv', async (req, res) => {
    const { email_config, start_time, end_time, to, cc } = req.body;
    
    // Validate required fields
    if (!email_config || !start_time || !end_time || !to || !Array.isArray(to) || to.length === 0) {
      log_action('API_EMAIL_NATIONAL_ID_CSV_ATTEMPT', 'Missing required fields');
      return res.status(400).json({
        error: 'Request body must contain "email_config", "start_time", "end_time", and "to" (array) fields.'
      });
    }

    // Validate email_config structure
    if (!email_config.host || !email_config.port || !email_config.user || !email_config.pass || !email_config.from) {
      log_action('API_EMAIL_NATIONAL_ID_CSV_ATTEMPT', 'Invalid email_config');
      return res.status(400).json({
        error: 'email_config must contain "host", "port", "secure", "user", "pass", and "from" fields.'
      });
    }

    try {
      const result = await email_national_id_csv_service(email_config, start_time, end_time, to, cc);
      return res.json(result);
    } catch (err) {
      log_action('API_EMAIL_NATIONAL_ID_CSV_ERROR', err.message);
      return res.status(500).json({
        error: 'Failed to email national ID CSV. See server logs for details.',
        details: err.message
      });
    }
  });

  return router;
};
