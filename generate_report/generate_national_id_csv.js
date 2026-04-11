const escape_csv_field = require('./escape_csv_field');

function national_id_to_csv_row(record) {
  return [
    record.id,
    record.FPG_logs_id,
    escape_csv_field(record.national_id_number),
    escape_csv_field(record.original_text),
    record.created_at,
    record.updated_at
  ].join(',');
}

function generate_national_id_csv(records) {
  const header = 'id,FPG_logs_id,national_id_number,original_text,created_at,updated_at';
  const rows = records.map(national_id_to_csv_row);
  return [header, ...rows].join('\n');
}

module.exports = generate_national_id_csv;
