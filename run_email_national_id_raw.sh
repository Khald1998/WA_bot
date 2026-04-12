#!/bin/bash
# Validate chats, collect evidence, then email unreported National IDs

LOG=/root/whatsapp-bot/cron.log

curl -sS -X POST http://localhost:3000/validate-chat-completeness >> "$LOG" 2>&1
curl -sS -X POST http://localhost:3000/collect-evidence >> "$LOG" 2>&1
curl -sS -X POST http://localhost:3000/email-raw \
  -H "Content-Type: application/json" \
  -d '{
    "type": "national_id",
    "to": [
      "Tbinessa@saib.com.sa",
      "Alhajoojs@saib.com.sa",
      "Hajajalmutairi@saib.com.sa",
      "Aalawn@saib.com.sa",
      "Aalsuwayri@saib.com.sa",
      "kalzahrani@saib.com.sa",
      "h.almutairi@saib.com.sa",
      "abdulazizalrayes@saib.com.sa",
      "a.alshebl@saib.com.sa",
      "m.alanazi@saib.com.sa",
      "oalharbi@saib.com.sa"
    ],
    "cc": [
      "aalasmari@saib.com.sa",
      "Analshammari@saib.com.sa",
      "Alharbif@saib.com.sa"
    ]
  }' >> "$LOG" 2>&1
