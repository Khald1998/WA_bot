const escape_csv_field = require('./escape_csv_field');

function iban_to_csv_row(record) {
  return [
    record.id,
    record.FPG_logs_id,
    escape_csv_field(record.iban_number),
    escape_csv_field(record.original_text),
    record.created_at,
    record.updated_at
  ].join(',');
}

function generate_iban_csv(records) {
  const header = 'id,FPG_logs_id,iban_number,original_text,created_at,updated_at';
  const rows = records.map(iban_to_csv_row);
  return [header, ...rows].join('\n');
}

module.exports = generate_iban_csv;
