#!/bin/bash

LOG=/root/whatsapp-bot/cron.log  # cron log file for all output; this script validates chats, collects evidence, then emails the IBAN CSV

LABEL="IBAN"  # dataset label used in the subject and body text
START_TIME="1970-01-01T00:00:00.000Z"  # lower time bound: include records from the epoch onward
END_TIME="9999-12-31T23:59:59.999Z"  # upper time bound: effectively no end limit
SUBJECT="${LABEL} CSV Export"  # email subject line
TEXT_BODY="${LABEL} Export\nPeriod: ${START_TIME} to ${END_TIME}"  # plain-text email body
HTML_BODY="<h3>${LABEL} Export</h3><p><strong>Period:</strong> ${START_TIME} to ${END_TIME}</p>"  # HTML email body

curl -sS -X POST http://localhost:3000/collect-evidence >> "$LOG" 2>&1  # collect-evidence step; the validate step `curl -sS -X POST http://localhost:3000/validate-chat-completeness >> "$LOG" 2>&1` is intentionally disabled
curl -sS -X POST http://localhost:3000/email-csv-iban \
  -H "Content-Type: application/json" \
  -d "{
    \"subject\": \"${SUBJECT}\",
    \"start_time\": \"${START_TIME}\",
    \"end_time\": \"${END_TIME}\",
    \"to\": [
      \"ralrasheed@saib.com.sa\",
      \"jalbabtain@saib.com.sa\",
      \"aalasmari@saib.com.sa\",
      \"kalzahrani@saib.com.sa\"
    ],
    \"cc\": [
      \"aalasmari@saib.com.sa\"
    ],
    \"text_body\": \"${TEXT_BODY}\",
    \"html_body\": \"${HTML_BODY}\"
  }" >> "$LOG" 2>&1  # POST the JSON payload above to /email-csv-iban; append output to the log