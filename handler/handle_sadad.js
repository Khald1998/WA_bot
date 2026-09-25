const crypto = require('crypto');  // load Node crypto for hashing bill numbers
const add_or_update_sadad = require('../db/utility/add_or_update_sadad');  // import SADAD upsert helper
const update_log_validity = require('../db/utility/update_log_validity');  // helper to set the is_valid_* flag on the FPG_logs row
const send_unreported_sadad_email = require('../services/send_unreported_sadad_email');  // import the unreported-SADAD email sender
const { log_action } = require('../debug/logger');  // import the structured action logger

const TO = [  // primary recipients for the SADAD email
  'Tbinessa@saib.com.sa',  // recipient
  'Alhajoojs@saib.com.sa',  // recipient
  'Aalawn@saib.com.sa',  // recipient
  'Aalsuwayri@saib.com.sa',  // recipient
  'kalzahrani@saib.com.sa',  // recipient
  'h.almutairi@saib.com.sa',  // recipient
  'abdulazizalrayes@saib.com.sa',  // recipient
  'a.alshebl@saib.com.sa',  // recipient
  'm.alanazi@saib.com.sa',  // recipient
  'oalharbi@saib.com.sa',  // recipient
  'jalbabtain@saib.com.sa',  // recipient
  'ralrasheed@saib.com.sa'  // recipient
];  // end TO list
const CC = [  // carbon-copy recipients for the SADAD email
  'aalasmari@saib.com.sa',  // cc recipient
  'Analshammari@saib.com.sa',  // cc recipient
  'Alharbif@saib.com.sa'  // cc recipient
];  // end CC list
const SUBJECT = 'Unreported SADAD';  // subject line for the SADAD email

async function handle_sadad(sadads, body, mid, serialized) {  // handle SADAD bills parsed from a message
    try {  // guard the whole handler
        if (sadads.length > 0) {  // only proceed when bills were found
            log_action('HANDLE_SADAD', `mid: ${mid}, count: ${sadads.length}`);  // log the message id and bill count
            const timestamp = new Date(Date.now() + 3 * 3600 * 1000).toISOString().replace('Z', '+03:00');  // build a Riyadh (+03:00) ISO timestamp
            await Promise.all(sadads.map(({ sadad_number, sadad_type }) => {  // upsert every parsed bill in parallel
                const id = crypto.createHash('sha256').update('sadad:' + sadad_number).digest('hex');  // derive a stable row id from the bill number; ID is derived from the bill number ALONE (not the message id) so the same bill re-posted in different messages maps to ONE row — a bill already reported to the bank is never emailed again.
                return add_or_update_sadad({  // upsert the SADAD bill row
                    id,  // stable primary key
                    FPG_logs_id: mid,  // source message id
                    sadad_number,  // the SADAD bill number
                    sadad_type,  // the classified bill type
                    original_text: body,  // full original message text
                    created_at: timestamp,  // creation timestamp
                    updated_at: timestamp,  // last-update timestamp
                });  // end add_or_update_sadad call
            }));  // end Promise.all over the mapped upserts

            send_unreported_sadad_email(TO, CC, SUBJECT).catch(err =>  // fire the unreported-SADAD email, catching failures
                log_action('SEND_UNREPORTED_SADAD_EMAIL_ERROR', err.message)  // log any email send error
            );  // end catch handler
        }  // end has-bills block

        await update_log_validity('sadad', sadads.length > 0 ? 1 : 0, serialized);  // mark whether this message had valid SADAD
    } catch (err) {  // catch any handler failure
        log_action('HANDLE_SADAD_ERROR', `mid: ${mid}, error: ${err.message}`);  // log the handler error
    }  // end try/catch
}  // end handle_sadad

module.exports = handle_sadad;  // export the handler
