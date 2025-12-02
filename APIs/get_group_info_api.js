// APIs/get_group_info_api.js
// API route to get group info by JID

const express = require('express');
const { get_group_info } = require('../services/get_group_info_service');
const { log_action } = require('../debug/logger');

module.exports = (client, get_client_ready) => {
  const router = express.Router();

  // POST /group_info { group_jid: '...' }
  router.post('/group_info', async (req, res) => {
    if (!get_client_ready()) {
      log_action('API_GROUP_INFO_ATTEMPT', 'Client not ready');
      return res.status(503).json({
        error: 'WhatsApp client not ready yet. Please wait a moment and try again.'
      });
    }
    const { group_jid } = req.body;
    if (!group_jid) {
      return res.status(400).json({ error: 'Missing group_jid in request body.' });
    }
    try {
      const info = await get_group_info(client, group_jid);
      if (!info) {
        return res.status(404).json({ error: 'Group not found or not a group chat.' });
      }
      res.json({ group: info });
    } catch (error) {
      log_action('API_GROUP_INFO_ERROR', error.message);
      res.status(500).json({ error: 'Failed to fetch group info', details: error.message });
    }
  });

  return router;
};
