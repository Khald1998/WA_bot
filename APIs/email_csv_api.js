const express = require('express');
const router = express.Router();
const email_csv_service = require('../services/email_csv_service');
const { log_action } = require('../debug/logger');

const get_ibans_by_time = require('../getters/get_ibans_by_time');
const get_phones_by_time = require('../getters/get_phones_by_time');
const get_sadads_by_time = require('../getters/get_sadads_by_time');
const get_national_ids_by_time = require('../getters/get_national_ids_by_time');

const generate_iban_csv = require('../generate_report/generate_iban_csv');
const generate_phone_csv = require('../generate_report/generate_phone_csv');
const generate_sadad_csv = require('../generate_report/generate_sadad_csv');
const generate_national_id_csv = require('../generate_report/generate_national_id_csv');

const TYPE_MAP = {
  iban:        { get_data: get_ibans_by_time,        generate_csv: generate_iban_csv,        label: 'IBAN' },
  phone:       { get_data: get_phones_by_time,        generate_csv: generate_phone_csv,       label: 'Phone Numbers' },
  sadad:       { get_data: get_sadads_by_time,        generate_csv: generate_sadad_csv,       label: 'SADAD' },
  national_id: { get_data: get_national_ids_by_time,  generate_csv: generate_national_id_csv, label: 'National IDs' },
};

module.exports = () => {
  router.post('/email-csv', async (req, res) => {
    const { start_time, end_time, to, cc, type, text_body, html_body } = req.body;

    if (!start_time || !end_time || !to || !Array.isArray(to) || to.length === 0 || !type) {
      log_action('API_EMAIL_CSV_ATTEMPT', 'Missing required fields');
      return res.status(400).json({
        error: 'Request body must contain "start_time", "end_time", "to" (array), and "type" fields.'
      });
    }

    const config = TYPE_MAP[type];
    if (!config) {
      log_action('API_EMAIL_CSV_ATTEMPT', `Unknown type: ${type}`);
      return res.status(400).json({
        error: `Unknown type "${type}". Valid types: ${Object.keys(TYPE_MAP).join(', ')}.`
      });
    }

    try {
      const result = await email_csv_service(
        start_time, end_time, to, cc,
        config.label, config.get_data, config.generate_csv,
        text_body, html_body
      );
      return res.json(result);
    } catch (err) {
      log_action('API_EMAIL_CSV_ERROR', err.message);
      return res.status(500).json({
        error: 'Failed to email CSV. See server logs for details.',
        details: err.message
      });
    }
  });

  return router;
};
