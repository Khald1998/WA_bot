const express = require('express');
const router = express.Router();
const { log_action } = require('../debug/logger');
const get_sadads_by_time = require('../getters/get_sadads_by_time');

module.exports = () => {
  router.get('/sadads', async (req, res) => {
    const { start_time, end_time } = req.query;

    if (!start_time || !end_time) {
      return res.status(400).json({
        error: 'Query params "start_time" and "end_time" are required (ISO datetime).'
      });
    }

    try {
      log_action('API_GET_SADADS_ATTEMPT', `start_time: ${start_time}, end_time: ${end_time}`);
      const records = await get_sadads_by_time(start_time, end_time);
      log_action('API_GET_SADADS_SUCCESS', `Found ${records.length} records`);
      return res.json({ success: true, count: records.length, records });
    } catch (err) {
      log_action('API_GET_SADADS_ERROR', err.message);
      return res.status(500).json({ error: 'Failed to fetch sadads.', details: err.message });
    }
  });

  return router;
};
