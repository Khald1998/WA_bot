const express = require('express');  // web framework used to build the HTTP API; api for getting all individual (non-group) chats
const { get_individual_chats } = require('../getters/get_individual_chats_service');  // service that lists individual chats
const { log_action } = require('../debug/logger');  // structured action logger

module.exports = (client, get_client_ready) => {  // export a factory that builds the router
  const router = express.Router();  // create an isolated Express router

  router.get('/individual_chats', async (req, res) => {  // GET /individual_chats returns a list of individual chat names; register the individual-chats GET endpoint
    if (!get_client_ready()) {  // reject requests before the WhatsApp client is ready
      log_action('API_INDIVIDUAL_CHATS_ATTEMPT', 'Client not ready');  // log the premature attempt
      return res.status(503).json({  // respond 503 Service Unavailable
        error: 'WhatsApp client not ready yet. Please wait a moment and try again.'  // human-readable not-ready message
      });  // end 503 JSON payload
    }  // end not-ready guard
    try {  // attempt to fetch and return chats
      const chats = await get_individual_chats(client);  // fetch individual chats from the client
      log_action('API_INDIVIDUAL_CHATS_SUCCESS', `Returned ${chats.length} individual chat(s)`);  // log how many chats were returned
      res.json({ individual_chats: chats });  // send the chat list back as JSON
    } catch (error) {  // handle any failure during fetch
      log_action('API_INDIVIDUAL_CHATS_ERROR', error.message);  // log the error message
      res.status(500).json({ error: 'Failed to fetch individual chats', details: error.message });  // respond 500 with error details
    }  // end try/catch
  });  // end endpoint handler

  return router;  // return the configured router
};  // end module factory
