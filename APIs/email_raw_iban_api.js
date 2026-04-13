const express = require('express');
const router = express.Router();
const email_service = require('../services/email_service');
const { log_action } = require('../debug/logger');

const get_unreported_ibans = require('../getters/get_unreported_IBANs');
const mark_ibans_as_reported = require('../db/utility/mark_ibans_as_reported');

module.exports = () => {
  router.post('/email-raw-iban', async (req, res) => {
    const { to, cc, subject, text_body, html_body } = req.body;

    if (
      !to || !Array.isArray(to) || to.length === 0 ||
      !cc || !Array.isArray(cc) || cc.length === 0 ||
      !subject || !text_body || !html_body
    ) {
      log_action('API_EMAIL_RAW_IBAN_ATTEMPT', 'Missing required fields');
      return res.status(400).json({
        error: 'Request body must contain "to" (array), "cc" (array), "subject", "text_body", and "html_body" fields.'
      });
    }

    try {
      const records = await get_unreported_ibans();
      log_action('EMAIL_IBAN_RAW_QUERY_SUCCESS', `Found ${records.length} unreported IBAN`);

      if (records.length === 0) {
        log_action('EMAIL_IBAN_RAW_NO_DATA', 'No unreported IBAN found');
        return res.json({ success: false, message: 'No unreported IBAN found' });
      }

      await email_service(to, cc, subject, text_body, html_body);

      const mark_result = await mark_ibans_as_reported(records.map(r => r.id));
      log_action('EMAIL_IBAN_RAW_MARK_REPORTED', `Marked ${mark_result.changes} IBAN as reported`);
      return res.json({
        success: true,
        record_count: records.length,
        marked_as_reported: mark_result.changes,
        sent_to: to,
        cc
      });
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
