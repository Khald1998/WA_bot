#!/bin/bash
# Run WhatsApp bot HTTP request scripts every 15 minutes, one after another

cd /root/whatsapp-bot

node HTTP_request/validate_chat_completeness_request.js
node HTTP_request/collect_evidence_request.js
node HTTP_request/email_iban_request.js
