const express = require('express');
const group_service = require('../services/group_service');
const { log_action } = require('../debug/logger');

module.exports = (client, get_client_ready) => {
  const router = express.Router();

  // GET /groups - Return a list of group names
  router.get('/groups', async (req, res) => {
    if (!get_client_ready()) {
      log_action('API_GROUPS_ATTEMPT', 'Client not ready');
      return res.status(503).json({
        error: 'WhatsApp client not ready yet. Please wait a moment and try again.'
      });
    }
    try {
      const group_names = await group_service.get_group_names(client);
      log_action('API_GROUPS_SUCCESS', `Returned ${group_names.length} group(s)`);
      res.json({ groups: group_names });
    } catch (error) {
      log_action('API_GROUPS_ERROR', error.message);
      res.status(500).json({ error: 'Failed to fetch group names' });
    }
  });

  return router;
};
