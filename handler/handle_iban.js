const crypto = require('crypto');  // Node core crypto for hashing
const add_or_update_IBAN = require('../db/utility/add_or_update_IBAN');  // IBAN upsert helper
const update_log_validity = require('../db/utility/update_log_validity');  // helper to set the is_valid_* flag on the FPG_logs row
const send_unreported_iban_email = require('../services/send_unreported_iban_email');  // service that emails unreported IBANs
const { log_action } = require('../debug/logger');  // structured action logger

const TO = [  // primary email recipients
  'Tbinessa@saib.com.sa',  // TO recipient
  'Alhajoojs@saib.com.sa',  // TO recipient
  'Aalawn@saib.com.sa',  // TO recipient
  'Aalsuwayri@saib.com.sa',  // TO recipient
  'kalzahrani@saib.com.sa',  // TO recipient
  'h.almutairi@saib.com.sa',  // TO recipient
  'abdulazizalrayes@saib.com.sa',  // TO recipient
  'a.alshebl@saib.com.sa',  // TO recipient
  'm.alanazi@saib.com.sa',  // TO recipient
  'oalharbi@saib.com.sa',  // TO recipient
  'jalbabtain@saib.com.sa',  // TO recipient
  'ralrasheed@saib.com.sa'  // TO recipient (last, no comma)
];  // end TO list
const CC = [  // carbon-copy recipients
  'aalasmari@saib.com.sa',  // CC recipient
  'Analshammari@saib.com.sa',  // CC recipient
  'Alharbif@saib.com.sa'  // CC recipient (last, no comma)
];  // end CC list
const SUBJECT = 'Unreported IBAN';  // email subject line

async function handle_iban(ibans, body, mid, serialized) {  // store IBANs and flag the log row
    try {  // guard the whole handler
        if (ibans.length > 0) {  // only act when IBANs were found
            log_action('HANDLE_IBAN', `mid: ${mid}, count: ${ibans.length}`);  // log the handling event
            const timestamp = new Date(Date.now() + 3 * 3600 * 1000).toISOString().replace('Z', '+03:00');  // Riyadh-time (+03:00) ISO timestamp
            await Promise.all(ibans.map(iban_number => {  // upsert every IBAN concurrently
                const id = crypto.createHash('sha256').update('iban:' + iban_number).digest('hex');  // deterministic id from the IBAN value — ID from the IBAN alone (not the message id) so the same IBAN re-posted in different messages maps to ONE row — a reported IBAN is never emailed to the bank again.
                return add_or_update_IBAN({  // upsert this IBAN row
                    id,  // primary key
                    FPG_logs_id: mid,  // link to the source log message
                    iban_number,  // the IBAN value
                    original_text: body,  // full original message text
                    created_at: timestamp,  // creation time
                    updated_at: timestamp,  // last-update time
                });  // end upsert payload
            }));  // end map and Promise.all

            send_unreported_iban_email(TO, CC, SUBJECT).catch(err =>  // send the alert email, catching failures
                log_action('SEND_UNREPORTED_IBAN_EMAIL_ERROR', err.message)  // log any send failure
            );  // end catch handler
        }  // end IBAN-present block

        await update_log_validity('iban', ibans.length > 0 ? 1 : 0, serialized);  // set the IBAN validity flag on the log row
    } catch (err) {  // handle any thrown error
        log_action('HANDLE_IBAN_ERROR', `mid: ${mid}, error: ${err.message}`);  // log the failure
    }  // end catch
}  // end handle_iban function

module.exports = handle_iban;  // export the handler
