// Responsible for handling the /send-national-id-csv API endpoint and delegating to the send_national_id_csv_service

const express = require('express');
const router = express.Router();
const { send_national_id_csv_service } = require('../services/send_national_id_csv_service');
const { log_action } = require('../debug/logger');

module.exports = (client, is_client_ready) => {
  // POST /send-national-id-csv
  router.post('/send-national-id-csv', async (req, res) => {
    if (!is_client_ready()) {
      log_action('API_SEND_NATIONAL_ID_CSV_ATTEMPT', 'Client not ready');
      return res.status(503).json({
        error: 'WhatsApp client not ready yet. Please wait a moment and try again.'
      });
    }

    const { start_time, end_time, numbers } = req.body;
    if (!start_time || !end_time || !numbers || !Array.isArray(numbers) || numbers.length === 0) {
      log_action('API_SEND_NATIONAL_ID_CSV_ATTEMPT', 'Missing required fields');
      return res.status(400).json({
        error: 'Request body must contain "start_time", "end_time", and "numbers" (array) fields.'
      });
    }

    try {
      const result = await send_national_id_csv_service(client, start_time, end_time, numbers);
      return res.json(result);
    } catch (err) {
      log_action('API_SEND_NATIONAL_ID_CSV_ERROR', err.message);
      return res.status(500).json({
        error: 'Failed to send national ID CSV. See server logs for details.',
        details: err.message
      });
    }
  });

  return router;
};
