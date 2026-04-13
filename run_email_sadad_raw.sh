#!/bin/bash
# Validate chats, collect evidence, then email unreported SADADs

LOG=/root/whatsapp-bot/cron.log

LABEL="SADAD"
SUBJECT="Unreported ${LABEL}"

#curl -sS -X POST http://localhost:3000/validate-chat-completeness >> "$LOG" 2>&1
curl -sS -X POST http://localhost:3000/collect-evidence >> "$LOG" 2>&1
curl -sS -X POST http://localhost:3000/email-raw-sadad \
  -H "Content-Type: application/json" \
  -d "{
    \"subject\": \"${SUBJECT}\",
    \"to\": [
      \"Tbinessa@saib.com.sa\",
      \"Alhajoojs@saib.com.sa\",
      \"Hajajalmutairi@saib.com.sa\",
      \"Aalawn@saib.com.sa\",
      \"Aalsuwayri@saib.com.sa\",
      \"kalzahrani@saib.com.sa\",
      \"h.almutairi@saib.com.sa\",
      \"abdulazizalrayes@saib.com.sa\",
      \"a.alshebl@saib.com.sa\",
      \"m.alanazi@saib.com.sa\",
      \"oalharbi@saib.com.sa\"
    ],
    \"cc\": [
      \"aalasmari@saib.com.sa\",
      \"Analshammari@saib.com.sa\",
      \"Alharbif@saib.com.sa\"
    ]
  }" >> "$LOG" 2>&1
