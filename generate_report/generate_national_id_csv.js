const escape_csv_field = require('./escape_csv_field');  // load the CSV field escaper helper

function national_id_to_csv_row(record) {  // turn one national-ID DB record into a CSV row string
  return [  // assemble the ordered list of column values
    record.id,  // column 1: the row's primary key id
    record.FPG_logs_id,  // column 2: foreign key to the FPG_logs entry
    escape_csv_field(record.national_id_number),  // column 3: national ID number, CSV-escaped
    escape_csv_field(record.original_text),  // column 4: original message text, CSV-escaped
    record.created_at,  // column 5: creation timestamp
    record.updated_at  // column 6: last-updated timestamp
  ].join(',');  // join the columns with commas into one CSV line
}  // end national_id_to_csv_row

function generate_national_id_csv(records) {  // build a full CSV document from national-ID records
  const header = 'id,FPG_logs_id,national_id_number,original_text,created_at,updated_at';  // define the CSV header row
  const rows = records.map(national_id_to_csv_row);  // convert every record into a CSV row
  return [header, ...rows].join('\n');  // prepend the header and join all lines with newlines
}  // end generate_national_id_csv

module.exports = generate_national_id_csv;  // export the CSV generator as the module's default
