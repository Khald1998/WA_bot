function email_build_html_body(label, start_time, end_time, count) {
  return `
    <h3>${label} Export</h3>
    <p><strong>Period:</strong> ${start_time} to ${end_time}</p>
    <p><strong>Total records:</strong> ${count}</p>
  `;
}

module.exports = email_build_html_body;
