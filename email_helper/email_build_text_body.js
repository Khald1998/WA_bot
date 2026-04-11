function email_build_text_body(label, start_time, end_time, count) {
  return `${label} Export\nPeriod: ${start_time} to ${end_time}\nTotal records: ${count}`;
}

module.exports = email_build_text_body;
