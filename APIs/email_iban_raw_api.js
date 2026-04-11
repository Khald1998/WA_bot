// Responsible for handling the /email-iban-raw API endpoint and delegating to the email_iban_raw_service

const express = require('express');
const router = express.Router();
const email_iban_raw_service = require('../services/email_iban_raw_service');
const { log_action } = require('../debug/logger');

module.exports = () => {
  // POST /email-iban-raw
  router.post('/email-iban-raw', async (req, res) => {
    const { email_config, to, cc } = req.body;
    
    // Validate required fields
    if (!email_config || !to || !Array.isArray(to) || to.length === 0) {
      log_action('API_EMAIL_IBAN_RAW_ATTEMPT', 'Missing required fields');
      return res.status(400).json({
        error: 'Request body must contain "email_config" and "to" (array) fields.'
      });
    }

    // Validate email_config structure
    const has_service = !!email_config.service;
    const has_host_config = email_config.host && email_config.port && email_config.secure !== undefined;
    if ((!has_service && !has_host_config) || !email_config.user || !email_config.pass || !email_config.from) {
      log_action('API_EMAIL_IBAN_RAW_ATTEMPT', 'Invalid email_config');
      return res.status(400).json({
        error: 'email_config must contain "user", "pass", "from", and either "service" or ("host", "port", "secure") fields.'
      });
    }

    try {
      const result = await email_iban_raw_service(email_config, to, cc);
      return res.json(result);
    } catch (err) {
      log_action('API_EMAIL_IBAN_RAW_ERROR', err.message);
      return res.status(500).json({
        error: 'Failed to email unreported IBANs. See server logs for details.',
        details: err.message
      });
    }
  });

  return router;
};
