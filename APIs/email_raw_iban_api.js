const express = require('express');
const router = express.Router();
const email_service = require('../services/email_service');
const { log_action } = require('../debug/logger');

const get_unreported_ibans = require('../getters/get_unreported_IBANs');
const mark_ibans_as_reported = require('../db/utility/mark_ibans_as_reported');

const escape_html = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function build_body(records) {
  const total = records.length;

  const text_lines = ['Unreported IBAN Records', `Total: ${total}`, ''];
  records.forEach((r, i) => {
    text_lines.push(
      `Record ${i + 1}`,
      `iban_number: ${r.iban_number ?? ''}`,
      `original_text: ${r.original_text ?? ''}`,
      `created_at: ${r.created_at ?? ''}`,
      ''
    );
  });

  const html_records = records.map((r, i) => `
    <div style="border:1px solid #ddd;padding:12px;margin:8px 0;border-radius:6px;">
      <strong>Record ${i + 1}</strong><br>
      <strong>iban_number:</strong> ${escape_html(r.iban_number)}<br>
      <strong>original_text:</strong> ${escape_html(r.original_text)}<br>
      <strong>created_at:</strong> ${escape_html(r.created_at)}
    </div>`).join('');

  const html = `<h2>Unreported IBAN Records</h2><p><strong>Total:</strong> ${total}</p><hr>${html_records}`;

  return { text: text_lines.join('\n'), html };
}

module.exports = () => {
  router.post('/email-raw-iban', async (req, res) => {
    const { to, cc, subject } = req.body;

    if (
      !to || !Array.isArray(to) || to.length === 0 ||
      !cc || !Array.isArray(cc) || cc.length === 0 ||
      !subject
    ) {
      log_action('API_EMAIL_RAW_IBAN_ATTEMPT', 'Missing required fields');
      return res.status(400).json({
        error: 'Request body must contain "to" (array), "cc" (array), and "subject" fields.'
      });
    }

    try {
      const records = await get_unreported_ibans();
      log_action('EMAIL_IBAN_RAW_QUERY_SUCCESS', `Found ${records.length} unreported IBAN`);

      if (records.length === 0) {
        log_action('EMAIL_IBAN_RAW_NO_DATA', 'No unreported IBAN found');
        return res.json({ success: false, message: 'No unreported IBAN found' });
      }

      const { text, html } = build_body(records);
      await email_service(to, cc, subject, text, html);

      const mark_result = await mark_ibans_as_reported(records.map(r => r.id));
      log_action('EMAIL_IBAN_RAW_MARK_REPORTED', `Marked ${mark_result.changes} IBAN as reported`);
      return res.json({
        success: true,
        record_count: records.length,
        marked_as_reported: mark_result.changes,
        sent_to: to,
        cc
      });
    } catch (err) {
      log_action('API_EMAIL_RAW_IBAN_ERROR', err.message);
      return res.status(500).json({
        error: 'Failed to email unreported IBAN. See server logs for details.',
        details: err.message
      });
    }
  });

  return router;
};
