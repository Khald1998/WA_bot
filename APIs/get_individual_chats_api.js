// APIs/get_individual_chats_api.js
// API for getting all individual (non-group) chats

const express = require('express');
const { get_individual_chats } = require('../services/get_individual_chats_service');
const { log_action } = require('../debug/logger');

module.exports = (client, get_client_ready) => {
  const router = express.Router();

  // GET /individual_chats - Return a list of individual chat names
  router.get('/individual_chats', async (req, res) => {
    if (!get_client_ready()) {
      log_action('API_INDIVIDUAL_CHATS_ATTEMPT', 'Client not ready');
      return res.status(503).json({
        error: 'WhatsApp client not ready yet. Please wait a moment and try again.'
      });
    }
    try {
      const chats = await get_individual_chats(client);
      log_action('API_INDIVIDUAL_CHATS_SUCCESS', `Returned ${chats.length} individual chat(s)`);
      res.json({ individual_chats: chats });
    } catch (error) {
      log_action('API_INDIVIDUAL_CHATS_ERROR', error.message);
      res.status(500).json({ error: 'Failed to fetch individual chats', details: error.message });
    }
  });

  return router;
};
