// APIs/validate_chat_completeness_api.js
// Responsible for handling the /validate-chat-completeness API endpoint

const express = require('express');
const router = express.Router();
const { validate_chat_completeness } = require('../services/validate_chat_completeness');
const { log_action } = require('../debug/logger');

module.exports = (client, is_client_ready) => {
  // POST /validate-chat-completeness
  router.post('/validate-chat-completeness', async (req, res) => {
    if (!is_client_ready()) {
      log_action('API_VALIDATE_CHAT_ATTEMPT', 'Client not ready');
      return res.status(503).json({
        error: 'WhatsApp client not ready yet. Please wait a moment and try again.'
      });
    }

    try {
      log_action('API_VALIDATE_CHAT_START', 'Starting validation');
      const result = await validate_chat_completeness(client);
      log_action('API_VALIDATE_CHAT_SUCCESS', `Completed: ${result.insertedCount} inserted`);
      return res.json({
        success: true,
        message: 'Chat validation completed successfully',
        data: result
      });
    } catch (err) {
      log_action('API_VALIDATE_CHAT_ERROR', err.message);
      return res.status(500).json({
        error: 'Failed to validate chat completeness. See server logs for details.',
        details: err.message
      });
    }
  });

  return router;
};
