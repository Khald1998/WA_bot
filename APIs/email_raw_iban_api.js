const express = require('express');
const router = express.Router();
const { log_action } = require('../debug/logger');
const send_unreported_iban_email = require('../services/send_unreported_iban_email');

module.exports = () => {
  router.post('/email-raw-iban', async (req, res) => {
    const { to, cc, subject } = req.body;

    if (
      !to || !Array.isArray(to) || to.length === 0 ||
      !cc || !Array.isArray(cc) || cc.length === 0 ||
      !subject
    ) {
      log_action('API_EMAIL_RAW_IBAN_ATTEMPT', 'Missing required fields');
      return res.status(400).json({
        error: 'Request body must contain "to" (array), "cc" (array), and "subject" fields.'
      });
    }

    try {
      const result = await send_unreported_iban_email(to, cc, subject);
      return res.json(result);
    } catch (err) {
      log_action('API_EMAIL_RAW_IBAN_ERROR', err.message);
      return res.status(500).json({
        error: 'Failed to email unreported IBAN. See server logs for details.',
        details: err.message
      });
    }
  });

  return router;
};
