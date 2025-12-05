// Responsible for handling the /send-phone-csv API endpoint and delegating to the send_phone_csv_service

const express = require('express');
const router = express.Router();
const { send_phone_csv_service } = require('../services/send_phone_csv_service');
const { log_action } = require('../debug/logger');

module.exports = (client, is_client_ready) => {
  // POST /send-phone-csv
  router.post('/send-phone-csv', async (req, res) => {
    if (!is_client_ready()) {
      log_action('API_SEND_PHONE_CSV_ATTEMPT', 'Client not ready');
      return res.status(503).json({
        error: 'WhatsApp client not ready yet. Please wait a moment and try again.'
      });
    }

    const { startTime, endTime, numbers } = req.body;
    if (!startTime || !endTime || !numbers || !Array.isArray(numbers) || numbers.length === 0) {
      log_action('API_SEND_PHONE_CSV_ATTEMPT', 'Missing required fields');
      return res.status(400).json({
        error: 'Request body must contain "startTime", "endTime", and "numbers" (array) fields.'
      });
    }

    try {
      const result = await send_phone_csv_service(client, startTime, endTime, numbers);
      return res.json(result);
    } catch (err) {
      log_action('API_SEND_PHONE_CSV_ERROR', err.message);
      return res.status(500).json({
        error: 'Failed to send phone CSV. See server logs for details.',
        details: err.message
      });
    }
  });

  return router;
};
