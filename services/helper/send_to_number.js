async function send_to_number(client, media, chat_id, caption) {
  await client.sendMessage(chat_id, media, { caption });
}

module.exports = send_to_number;
