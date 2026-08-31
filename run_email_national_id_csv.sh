#!/bin/bash
# Validate chats, collect evidence, then email National ID CSV

LOG=/root/whatsapp-bot/cron.log

LABEL="National IDs"
START_TIME="1970-01-01T00:00:00.000Z"
END_TIME="9999-12-31T23:59:59.999Z"
SUBJECT="${LABEL} CSV Export"
TEXT_BODY="${LABEL} Export\nPeriod: ${START_TIME} to ${END_TIME}"
HTML_BODY="<h3>${LABEL} Export</h3><p><strong>Period:</strong> ${START_TIME} to ${END_TIME}</p>"

#curl -sS -X POST http://localhost:3000/validate-chat-completeness >> "$LOG" 2>&1
curl -sS -X POST http://localhost:3000/collect-evidence >> "$LOG" 2>&1
curl -sS -X POST http://localhost:3000/email-csv-national-id \
  -H "Content-Type: application/json" \
  -d "{
    \"subject\": \"${SUBJECT}\",
    \"start_time\": \"${START_TIME}\",
    \"end_time\": \"${END_TIME}\",
    \"to\": [
      \"Tbinessa@saib.com.sa\",
      \"Alhajoojs@saib.com.sa\",
      \"Aalawn@saib.com.sa\",
      \"Aalsuwayri@saib.com.sa\",
      \"kalzahrani@saib.com.sa\",
      \"h.almutairi@saib.com.sa\",
      \"abdulazizalrayes@saib.com.sa\",
      \"a.alshebl@saib.com.sa\",
      \"m.alanazi@saib.com.sa\",
      \"oalharbi@saib.com.sa\",
      \"jalbabtain@saib.com.sa\",
      \"ralrasheed@saib.com.sa\"
    ],
    \"cc\": [
      \"aalasmari@saib.com.sa\",
      \"Analshammari@saib.com.sa\",
      \"Alharbif@saib.com.sa\"
    ],
    \"text_body\": \"${TEXT_BODY}\",
    \"html_body\": \"${HTML_BODY}\"
  }" >> "$LOG" 2>&1
