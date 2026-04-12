const express = require('express');
const router = express.Router();
const email_raw_service = require('../services/email_raw_service');
const { log_action } = require('../debug/logger');

const get_unreported_ibans = require('../getters/get_unreported_IBANs');
const get_unreported_national_ids = require('../getters/get_unreported_national_ids');
const get_unreported_sadads = require('../getters/get_unreported_sadads');

const mark_ibans_as_reported = require('../db/utility/mark_ibans_as_reported');
const mark_national_ids_as_reported = require('../db/utility/mark_national_ids_as_reported');
const mark_sadads_as_reported = require('../db/utility/mark_sadads_as_reported');

const TYPE_MAP = {
  iban:        { get_data: get_unreported_ibans,        mark_as_reported: mark_ibans_as_reported,        label: 'IBAN' },
  national_id: { get_data: get_unreported_national_ids, mark_as_reported: mark_national_ids_as_reported, label: 'National ID' },
  sadad:       { get_data: get_unreported_sadads,       mark_as_reported: mark_sadads_as_reported,       label: 'SADAD' },
};

module.exports = () => {
  router.post('/email-raw', async (req, res) => {
    const { to, cc, type, subject, text_body, html_body } = req.body;

    if (!to || !Array.isArray(to) || to.length === 0 || !type) {
      log_action('API_EMAIL_RAW_ATTEMPT', 'Missing required fields');
      return res.status(400).json({
        error: 'Request body must contain "to" (array) and "type" fields.'
      });
    }

    const config = TYPE_MAP[type];
    if (!config) {
      log_action('API_EMAIL_RAW_ATTEMPT', `Unknown type: ${type}`);
      return res.status(400).json({
        error: `Unknown type "${type}". Valid types: ${Object.keys(TYPE_MAP).join(', ')}.`
      });
    }

    try {
      const result = await email_raw_service(
        to, cc,
        config.label, config.get_data, config.mark_as_reported,
        subject, text_body, html_body
      );
      return res.json(result);
    } catch (err) {
      log_action('API_EMAIL_RAW_ERROR', err.message);
      return res.status(500).json({
        error: `Failed to email unreported ${config.label}. See server logs for details.`,
        details: err.message
      });
    }
  });

  return router;
};