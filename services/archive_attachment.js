// Archives the EXACT bytes of an outgoing email attachment before it is sent,
// so every emailed .txt is recoverable byte-for-byte. Writes a per-email copy
// plus an append-only per-kind manifest entry. A failure here must never block
// the email, so everything is caught and only logged.

const fs = require('fs');
const path = require('path');
const { log_action } = require('../debug/logger');

// `kind` (e.g. 'IBAN', 'SADAD') names the manifest file and the log actions, so
// each report type keeps its own manifest. Defaults to IBAN for existing callers.
function archive_attachment(file_name, txt_content, to, cc, count, kind = 'IBAN') {
  try {
    const archive_dir = path.join(__dirname, '../Logs/sent_attachments');
    fs.mkdirSync(archive_dir, { recursive: true });
    fs.writeFileSync(path.join(archive_dir, file_name), txt_content, 'utf8');
    const manifest = path.join(archive_dir, `${kind.toLowerCase()}_email_manifest.log`);
    fs.appendFileSync(manifest,
      `[${file_name}] to=${JSON.stringify(to)} cc=${JSON.stringify(cc)} count=${count}\n` +
      txt_content + '\n---\n', 'utf8');
    log_action(`EMAIL_${kind}_ATTACHMENT_ARCHIVED`, `file: ${file_name}, ${count} ${kind}(s)`);
  } catch (archive_err) {
    log_action(`EMAIL_${kind}_ATTACHMENT_ARCHIVE_ERROR`, archive_err.message);
  }
}

module.exports = archive_attachment;
