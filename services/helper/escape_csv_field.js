function escape_csv_field(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

module.exports = escape_csv_field;
