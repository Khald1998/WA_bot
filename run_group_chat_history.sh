#!/bin/bash
# Fetch full group chat history and log a one-line summary.
# Intended to be invoked by cron every 10 minutes.

LOG=/root/whatsapp-bot/cron.log
GROUP_ID='120363199265021169@g.us'
URL="http://localhost:3000/group-chat-history/${GROUP_ID}"

ts=$(date -Is)

response=$(curl -sS -o /tmp/group_chat_history.json -w '%{http_code} %{size_download} %{time_total}' \
    --max-time 600 "$URL")
http_code=$(echo "$response" | awk '{print $1}')
size=$(echo "$response" | awk '{print $2}')
elapsed=$(echo "$response" | awk '{print $3}')

count=$(node -e '
try {
  const r = require("/tmp/group_chat_history.json");
  process.stdout.write(r.success ? String(r.messages.length) : ("err:" + (r.error || "").split("\n")[0]));
} catch (e) { process.stdout.write("parse_error"); }
' 2>/dev/null)

echo "[$ts] group-chat-history http=$http_code size=$size time=${elapsed}s count=$count" >> "$LOG"
