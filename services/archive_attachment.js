// Archives the EXACT bytes of an outgoing email attachment before it is sent,
// so every emailed .txt is recoverable byte-for-byte. Writes a per-email copy
// plus an append-only per-kind manifest entry. A failure here must never block
// the email, so everything is caught and only logged.

const fs = require('fs');                           // load the filesystem module
const path = require('path');                       // load the path-join helper
const { log_action } = require('../debug/logger');  // import the action logger helper

// `kind` (e.g. 'IBAN', 'SADAD') names the manifest file and the log actions, so
// each report type keeps its own manifest. Defaults to IBAN for existing callers.
function archive_attachment(file_name, txt_content, to, cc, count, kind = 'IBAN') {  // define the attachment archiver
  try {                                             // never let archiving block the email
    const archive_dir = path.join(__dirname, '../Logs/sent_attachments');  // build the archive directory path
    fs.mkdirSync(archive_dir, { recursive: true });  // ensure the archive directory exists
    fs.writeFileSync(path.join(archive_dir, file_name), txt_content, 'utf8');  // save the exact attachment bytes
    const manifest = path.join(archive_dir, `${kind.toLowerCase()}_email_manifest.log`);  // build the per-kind manifest path
    fs.appendFileSync(manifest,                     // append this send to the manifest
      `[${file_name}] to=${JSON.stringify(to)} cc=${JSON.stringify(cc)} count=${count}\n` +  // manifest header line with recipients and count
      txt_content + '\n---\n', 'utf8');             // append the body followed by a record separator
    log_action(`EMAIL_${kind}_ATTACHMENT_ARCHIVED`, `file: ${file_name}, ${count} ${kind}(s)`);  // log the successful archive
  } catch (archive_err) {                           // swallow any archiving failure
    log_action(`EMAIL_${kind}_ATTACHMENT_ARCHIVE_ERROR`, archive_err.message);  // log the archiving error
  }                                                 // end catch block
}                                                   // end function

module.exports = archive_attachment;                // export the attachment archiver
