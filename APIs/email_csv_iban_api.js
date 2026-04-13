const express = require('express');
const router = express.Router();
const email_service = require('../services/email_service');
const { log_action } = require('../debug/logger');

const get_ibans_by_time = require('../getters/get_ibans_by_time');
const generate_iban_csv = require('../generate_report/generate_iban_csv');

module.exports = () => {
  router.post('/email-csv-iban', async (req, res) => {
    const { start_time, end_time, to, cc, subject, text_body, html_body } = req.body;

    if (
      !start_time || !end_time ||
      !to || !Array.isArray(to) || to.length === 0 ||
      !cc || !Array.isArray(cc) || cc.length === 0 ||
      !subject || !text_body || !html_body
    ) {
      log_action('API_EMAIL_CSV_IBAN_ATTEMPT', 'Missing required fields');
      return res.status(400).json({
        error: 'Request body must contain "start_time", "end_time", "to" (array), "cc" (array), "subject", "text_body", and "html_body" fields.'
      });
    }

    try {
      log_action('API_EMAIL_CSV_IBAN_QUERY_ATTEMPT', `start_time: ${start_time}, end_time: ${end_time}`);
      const records = await get_ibans_by_time(start_time, end_time);
      log_action('API_EMAIL_CSV_IBAN_QUERY_SUCCESS', `Found ${records.length} records`);

      if (records.length === 0) {
        log_action('API_EMAIL_CSV_IBAN_NO_DATA', 'No records found in the specified time range');
        return res.json({ success: false, message: 'No records found in the specified time range' });
      }

      const csv_content = generate_iban_csv(records);
      log_action('API_EMAIL_CSV_IBAN_GENERATED', `CSV size: ${csv_content.length} bytes`);

      const file_name = `IBAN_${start_time.replace(/:/g, '-')}_to_${end_time.replace(/:/g, '-')}.csv`;

      await email_service(
        to, cc,
        subject, text_body, html_body,
        file_name, csv_content
      );
      return res.json({ success: true, record_count: records.length });
    } catch (err) {
      log_action('API_EMAIL_CSV_IBAN_ERROR', err.message);
      return res.status(500).json({
        error: 'Failed to email IBAN CSV. See server logs for details.',
        details: err.message
      });
    }
  });

  return router;
};
