function email_build_subject(label, start_time, end_time) {
  return `${label} Export - ${start_time} to ${end_time}`;
}

module.exports = email_build_subject;
