/**
 * API endpoint to fetch all group chat history
 * @file get_group_chat_history_api.js
 */

const express = require('express');
const { log_action } = require('../debug/logger');
const { get_all_group_chat_history } = require('../services/get_group_chat_history_service');

module.exports = (client, get_client_ready) => {
    const router = express.Router();

    /**
     * GET /group-chat-history/:group_id
     * Fetches all chat history for a given group
     */
    router.get('/group-chat-history/:group_id', async (req, res) => {
        if (!get_client_ready()) {
            log_action('API_GROUP_CHAT_HISTORY_ATTEMPT', 'Client not ready');
            return res.status(503).json({
                error: 'WhatsApp client not ready yet. Please wait a moment and try again.'
            });
        }

        const group_id = req.params.group_id;

        try {
            log_action('API_GROUP_CHAT_HISTORY_ATTEMPT', `Fetching history for group_id: ${group_id}`);
            const rawMessages = await get_all_group_chat_history(group_id, client);
            const messages = rawMessages.map(msg => ({
                body: msg.body,
                id_serialized: msg.id._serialized,
                type: msg.type
            }));
            log_action('API_GROUP_CHAT_HISTORY_SUCCESS', `Returned ${messages.length} messages for group_id: ${group_id}`);
            res.status(200).json({ success: true, messages });
        } catch (error) {
            log_action('API_GROUP_CHAT_HISTORY_ERROR', error.message);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    return router;
};
