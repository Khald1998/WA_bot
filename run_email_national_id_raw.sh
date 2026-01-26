#!/bin/bash
# Run WhatsApp bot HTTP request scripts for National ID raw email

cd /root/whatsapp-bot

/root/.nvm/versions/node/v24.1.0/bin/node HTTP_request/validate_chat_completeness_request.js >> /root/whatsapp-bot/cron.log 2>&1
/root/.nvm/versions/node/v24.1.0/bin/node HTTP_request/collect_evidence_request.js >> /root/whatsapp-bot/cron.log 2>&1
/root/.nvm/versions/node/v24.1.0/bin/node HTTP_request/send_email_national_id_raw.js >> /root/whatsapp-bot/cron.log 2>&1
