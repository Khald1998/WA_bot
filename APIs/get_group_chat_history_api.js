/**
 * API endpoint to fetch all group chat history
 * @file get_group_chat_history_api.js
 */

const express = require('express');
const router = express.Router();
const { get_all_group_chat_history } = require('../services/get_group_chat_history_service');

/**
 * GET /api/group-chat-history/:group_id
 * Fetches all chat history for a given group
 * Query param: clientId (optional, depends on your client management)
 */
router.get('/group-chat-history/:group_id', async (req, res) => {
    const group_id = req.params.group_id;
    const client = req.app.get('whatsappClient'); // Adjust this to your client retrieval logic

    try {
        const messages = await get_all_group_chat_history(group_id, client);
        res.status(200).json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
