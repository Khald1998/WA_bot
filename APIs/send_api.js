// Responsible for handling the /send API endpoint and delegating to the send_message_service
const express = require('express');
const router = express.Router();
const { send_message_service } = require('../services/send_message_service');
const { logAction } = require('../debug/logger');

module.exports = (client, isClientReady) => {
  // POST /send (define full path here)
  router.post('/send', async (req, res) => {
    if (!isClientReady()) {
      logAction('API_SEND_ATTEMPT', 'Client not ready');
      return res.status(503).json({
        error: 'WhatsApp client not ready yet. Please wait a moment and try again.'
      });
    }

    const { number, message } = req.body;
    if (!number || !message) {
      logAction('API_SEND_ATTEMPT', 'Missing number or message');
      return res.status(400).json({
        error: 'Request body must contain both "number" and "message" fields.'
      });
    }

    try {
      logAction('API_SEND_ATTEMPT', `number: ${number}, message: ${message}`);
      const result = await send_message_service(client, number, message);
      logAction('API_SEND_SUCCESS', `number: ${number}`);
      return res.json(result);
    } catch (err) {
      logAction('API_SEND_ERROR', err.message);
      return res.status(500).json({
        error: 'Failed to send message. See server logs for details.',
        details: err.message
      });
    }
  });

  return router;
};
