const express = require('express');
const router = express.Router();
const email_service = require('../services/email_service');
const { log_action } = require('../debug/logger');

const get_unreported_national_ids = require('../getters/get_unreported_national_ids');
const mark_national_ids_as_reported = require('../db/utility/mark_national_ids_as_reported');

const escape_html = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function build_body(records) {
  const total = records.length;

  const text_lines = ['Unreported National ID Records', `Total: ${total}`, ''];
  records.forEach((r, i) => {
    text_lines.push(
      `Record ${i + 1}`,
      `national_id_number: ${r.national_id_number ?? ''}`,
      `original_text: ${r.original_text ?? ''}`,
      `created_at: ${r.created_at ?? ''}`,
      ''
    );
  });

  const html_records = records.map((r, i) => `
    <div style="border:1px solid #ddd;padding:12px;margin:8px 0;border-radius:6px;">
      <strong>Record ${i + 1}</strong><br>
      <strong>national_id_number:</strong> ${escape_html(r.national_id_number)}<br>
      <strong>original_text:</strong> ${escape_html(r.original_text)}<br>
      <strong>created_at:</strong> ${escape_html(r.created_at)}
    </div>`).join('');

  const html = `<h2>Unreported National ID Records</h2><p><strong>Total:</strong> ${total}</p><hr>${html_records}`;

  return { text: text_lines.join('\n'), html };
}

module.exports = () => {
  router.post('/email-raw-national-id', async (req, res) => {
    const { to, cc, subject } = req.body;

    if (
      !to || !Array.isArray(to) || to.length === 0 ||
      !cc || !Array.isArray(cc) || cc.length === 0 ||
      !subject
    ) {
      log_action('API_EMAIL_RAW_NATIONAL_ID_ATTEMPT', 'Missing required fields');
      return res.status(400).json({
        error: 'Request body must contain "to" (array), "cc" (array), and "subject" fields.'
      });
    }

    try {
      const records = await get_unreported_national_ids();
      log_action('EMAIL_NATIONAL_ID_RAW_QUERY_SUCCESS', `Found ${records.length} unreported National ID`);

      if (records.length === 0) {
        log_action('EMAIL_NATIONAL_ID_RAW_NO_DATA', 'No unreported National ID found');
        return res.json({ success: false, message: 'No unreported National ID found' });
      }

      const { text, html } = build_body(records);
      await email_service(to, cc, subject, text, html);

      const mark_result = await mark_national_ids_as_reported(records.map(r => r.id));
      log_action('EMAIL_NATIONAL_ID_RAW_MARK_REPORTED', `Marked ${mark_result.changes} National ID as reported`);
      return res.json({
        success: true,
        record_count: records.length,
        marked_as_reported: mark_result.changes,
        sent_to: to,
        cc
      });
    } catch (err) {
      log_action('API_EMAIL_RAW_NATIONAL_ID_ERROR', err.message);
      return res.status(500).json({
        error: 'Failed to email unreported National ID. See server logs for details.',
        details: err.message
      });
    }
  });

  return router;
};
