// Archives the EXACT bytes of an outgoing IBAN email attachment before it is
// sent, so every emailed .txt is recoverable byte-for-byte. Writes a per-email
// copy plus an append-only manifest entry. A failure here must never block the
// email, so everything is caught and only logged.

const fs = require('fs');
const path = require('path');
const { log_action } = require('../debug/logger');

function archive_attachment(file_name, txt_content, to, cc, count) {
  try {
    const archive_dir = path.join(__dirname, '../Logs/sent_attachments');
    fs.mkdirSync(archive_dir, { recursive: true });
    fs.writeFileSync(path.join(archive_dir, file_name), txt_content, 'utf8');
    const manifest = path.join(archive_dir, 'iban_email_manifest.log');
    fs.appendFileSync(manifest,
      `[${file_name}] to=${JSON.stringify(to)} cc=${JSON.stringify(cc)} count=${count}\n` +
      txt_content + '\n---\n', 'utf8');
    log_action('EMAIL_IBAN_ATTACHMENT_ARCHIVED', `file: ${file_name}, ${count} IBAN(s)`);
  } catch (archive_err) {
    log_action('EMAIL_IBAN_ATTACHMENT_ARCHIVE_ERROR', archive_err.message);
  }
}

module.exports = archive_attachment;
