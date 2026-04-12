const { log_action } = require('../debug/logger');
const { create_transporter } = require('../email_helper/email_create_transporter');
const send_email = require('../email_helper/email_send_to_recipient');

async function email_raw_service(to, cc, label, get_data, mark_as_reported, subject, text_body, html_body) {
  try {
    log_action(`EMAIL_${label}_RAW_QUERY_ATTEMPT`, `Fetching unreported ${label}`);

    const records = await get_data();
    log_action(`EMAIL_${label}_RAW_QUERY_SUCCESS`, `Found ${records.length} unreported ${label}`);

    if (records.length === 0) {
      log_action(`EMAIL_${label}_RAW_NO_DATA`, `No unreported ${label} found`);
      return { success: false, message: `No unreported ${label} found` };
    }

    const transporter = create_transporter();

    const final_subject = subject || `Unreported ${label} - ${records.length} records`;
    const fields = (r) => Object.entries(r).filter(([k]) => !['id', 'FPG_logs_id', 'is_reported', 'updated_at'].includes(k));
    const final_text = text_body || `Unreported ${label} Records\nTotal: ${records.length}\n\n` +
      records.map((r, i) => `Record ${i + 1}:\n` + fields(r).map(([k, v]) => `  ${k}: ${v}`).join('\n')).join('\n\n');
    const final_html = html_body || `<h3>Unreported ${label} Records</h3><p><strong>Total:</strong> ${records.length}</p><hr>` +
      records.map((r, i) => `<div style="margin-bottom:20px;padding:10px;border:1px solid #ddd;border-radius:5px;"><h4>Record ${i + 1}</h4>` +
        fields(r).map(([k, v]) => `<p><strong>${k}:</strong> ${v}</p>`).join('') + `</div>`).join('');

    log_action(`EMAIL_${label}_RAW_SEND_ATTEMPT`, `to: ${to}`);
    await send_email(transporter, {
      to, cc,
      subject: final_subject,
      text: final_text,
      html: final_html,
    });
    log_action(`EMAIL_${label}_RAW_SEND_SUCCESS`, `to: ${to}`);

    const ids = records.map(r => r.id);
    const mark_result = await mark_as_reported(ids);
    log_action(`EMAIL_${label}_RAW_MARK_REPORTED`, `Marked ${mark_result.changes} ${label} as reported`);

    return {
      success: true,
      record_count: records.length,
      marked_as_reported: mark_result.changes,
      sent_to: to,
      cc: cc || []
    };

  } catch (err) {
    log_action(`EMAIL_${label}_RAW_ERROR`, `error: ${err.message}`);
    throw err;
  }
}

module.exports = email_raw_service;