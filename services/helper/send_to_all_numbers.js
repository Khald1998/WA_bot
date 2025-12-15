const normalize_number = require('./normalize_number');

async function send_to_all_numbers(client, media, numbers, caption, log_action, log_prefix) {
  const results = [];
  for (const number of numbers) {
    const chat_id = normalize_number(number);
    if (log_action && log_prefix) log_action(`${log_prefix}_SEND_ATTEMPT`, `to: ${chat_id}`);
    try {
      await client.sendMessage(chat_id, media, { caption });
      if (log_action && log_prefix) log_action(`${log_prefix}_SEND_SUCCESS`, `to: ${chat_id}`);
      results.push({ number: chat_id, success: true });
    } catch (err) {
      if (log_action && log_prefix) log_action(`${log_prefix}_SEND_ERROR`, `to: ${chat_id}, error: ${err.message}`);
      results.push({ number: chat_id, success: false, error: err.message });
    }
  }
  return results;
}

module.exports = send_to_all_numbers;
