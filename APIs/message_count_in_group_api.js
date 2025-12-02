const express = require('express');
const { log_action } = require('../debug/logger');
const { get_message_count_in_group_service } = require('../services/get_message_count_in_group_service');

module.exports = (client, get_client_ready) => {
  const router = express.Router();

  // POST /message_count_in_group - Get the message count in a group by group_id
  router.post('/message_count_in_group', async (req, res) => {
    if (!get_client_ready()) {
      log_action('API_MESSAGE_COUNT_ATTEMPT', 'Client not ready');
      return res.status(503).json({
        error: 'WhatsApp client not ready yet. Please wait a moment and try again.'
      });
    }

    const { group_id } = req.body;
    if (!group_id) {
      log_action('API_MESSAGE_COUNT_ATTEMPT', 'Missing group_id');
      return res.status(400).json({ error: 'Request body must contain "group_id" field.' });
    }

    try {
      const count = await get_message_count_in_group_service(client, group_id);
      if (count === null) {
        log_action('API_MESSAGE_COUNT_ATTEMPT', `Group not found: ${group_id}`);
        return res.status(404).json({ error: 'Group not found.' });
      }
      log_action('API_MESSAGE_COUNT_SUCCESS', `Returned message count for group_id: ${group_id}`);
      res.json({ count });
    } catch (error) {
      log_action('API_MESSAGE_COUNT_ERROR', error.message);
      res.status(500).json({ error: 'Failed to fetch message count.' });
    }
  });

  return router;
};
