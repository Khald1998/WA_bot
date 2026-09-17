const escape_csv_field = require('./escape_csv_field');  // import the CSV field escaper helper

function phone_to_csv_row(record) {  // build one CSV row from a phone record
  return [  // assemble the row's columns into an array
    record.id,  // column 1: the phone record's primary key
    record.FPG_logs_id,  // column 2: the parent FPG log id
    escape_csv_field(record.phone_number),  // column 3: the phone number, CSV-escaped
    escape_csv_field(record.original_text),  // column 4: the original message text, CSV-escaped
    record.created_at,  // column 5: when the record was created
    record.updated_at  // column 6: when the record was last updated
  ].join(',');  // join the columns with commas into one CSV line
}  // end phone_to_csv_row

function generate_phone_csv(records) {  // build the full phone CSV from all records
  const header = 'id,FPG_logs_id,phone_number,original_text,created_at,updated_at';  // define the CSV header row
  const rows = records.map(phone_to_csv_row);  // convert every record into a CSV row string
  return [header, ...rows].join('\n');  // join header and rows with newlines into the CSV text
}  // end generate_phone_csv

module.exports = generate_phone_csv;  // export the CSV generator function
