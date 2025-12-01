const express = require('express');
const { log_action } = require('../debug/logger');
const { last_message_in_group_service } = require('../services/last_message_in_group_service');

module.exports = (client, get_client_ready) => {
  const router = express.Router();

  // POST /last_message_in_group - Get the last message in a group by group_id
  router.post('/last_message_in_group', async (req, res) => {
    if (!get_client_ready()) {
      log_action('API_LAST_MESSAGE_ATTEMPT', 'Client not ready');
      return res.status(503).json({
        error: 'WhatsApp client not ready yet. Please wait a moment and try again.'
      });
    }

    const { group_id } = req.body;
    if (!group_id) {
      log_action('API_LAST_MESSAGE_ATTEMPT', 'Missing group_id');
      return res.status(400).json({ error: 'Request body must contain "group_id" field.' });
    }

    try {
      const last_message = await last_message_in_group_service(client, group_id);
      if (!last_message) {
        log_action('API_LAST_MESSAGE_ATTEMPT', `No messages found for group_id: ${group_id}`);
        return res.status(404).json({ error: 'No messages found for this group.' });
      }
      log_action('API_LAST_MESSAGE_SUCCESS', `Returned last message for group_id: ${group_id}`);
      res.json({ last_message });
    } catch (error) {
      log_action('API_LAST_MESSAGE_ERROR', error.message);
      res.status(500).json({ error: 'Failed to fetch last message.' });
    }
  });

  return router;
};
