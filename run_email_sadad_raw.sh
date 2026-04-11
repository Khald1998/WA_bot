#!/bin/bash
# Run the send_email_sadad_raw.js script and log output

cd /root/whatsapp-bot
/root/.nvm/versions/node/v24.1.0/bin/node HTTP_request/validate_chat_completeness_request.js >> /root/whatsapp-bot/cron.log 2>&1
/root/.nvm/versions/node/v24.1.0/bin/node HTTP_request/collect_evidence_request.js >> /root/whatsapp-bot/cron.log 2>&1
/root/.nvm/versions/node/v24.1.0/bin/node HTTP_request/send_email_sadad_raw.js >> /root/whatsapp-bot/cron.log 2>&1
