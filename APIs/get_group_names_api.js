const express = require('express');  // web framework used to build the router
const group_service = require('../getters/get_group_names_service');  // service that lists WhatsApp group names
const { log_action } = require('../debug/logger');  // structured logger used across the bot

module.exports = (client, get_client_ready) => {  // export a factory taking the client and readiness getter
  const router = express.Router();  // create a fresh Express router

  // GET /groups - Return a list of group names
  router.get('/groups', async (req, res) => {  // handle GET /groups requests
    if (!get_client_ready()) {  // bail out if the WhatsApp client isn't ready
      log_action('API_GROUPS_ATTEMPT', 'Client not ready');  // log the premature attempt
      return res.status(503).json({  // respond 503 Service Unavailable with a JSON body
        error: 'WhatsApp client not ready yet. Please wait a moment and try again.'  // the human-readable not-ready message
      });  // end 503 response
    }  // end not-ready guard
    try {  // attempt to fetch the group names
      const group_names = await group_service.get_group_names(client);  // ask the service for the group names
      log_action('API_GROUPS_SUCCESS', `Returned ${group_names.length} group(s)`);  // log how many groups were returned
      res.json({ groups: group_names });  // send the group names back as JSON
    } catch (error) {  // handle any failure during the fetch
      log_action('API_GROUPS_ERROR', error.message);  // log the error message
      res.status(500).json({ error: 'Failed to fetch group names' });  // respond 500 with an error body
    }  // end try/catch
  });  // end GET /groups handler

  return router;  // return the configured router
};  // end exported factory