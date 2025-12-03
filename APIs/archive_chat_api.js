const express = require('express');
const { log_action } = require('../debug/logger');

module.exports = (client, get_client_ready) => {
  const router = express.Router();

  // POST /archive_chat - Archive a group chat by ID
  router.post('/archive_chat', async (req, res) => {
    if (!get_client_ready()) {
      log_action('API_ARCHIVE_ATTEMPT', 'Client not ready');
      return res.status(503).json({
        error: 'WhatsApp client not ready yet. Please wait a moment and try again.'
      });
    }

    const { group_id } = req.body;
    if (!group_id) {
      log_action('API_ARCHIVE_ATTEMPT', 'Missing group_id');
      return res.status(400).json({ error: 'Request body must contain "group_id" field.' });
    }

    // Archive logic will be implemented in the service later
    log_action('API_ARCHIVE_ATTEMPT', `Archive requested for group_id: ${group_id}`);
    res.json({ success: true, message: `Archive request received for group_id: ${group_id}` });
  });

  return router;
};