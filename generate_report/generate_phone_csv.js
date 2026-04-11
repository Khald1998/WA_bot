const escape_csv_field = require('./escape_csv_field');

function phone_to_csv_row(record) {
  return [
    record.id,
    record.FPG_logs_id,
    escape_csv_field(record.phone_number),
    escape_csv_field(record.original_text),
    record.created_at,
    record.updated_at
  ].join(',');
}

function generate_phone_csv(records) {
  const header = 'id,FPG_logs_id,phone_number,original_text,created_at,updated_at';
  const rows = records.map(phone_to_csv_row);
  return [header, ...rows].join('\n');
}

module.exports = generate_phone_csv;
