function escape_csv_field(value) {                   // format one value as a safe CSV field
  return `"${String(value).replace(/"/g, '""')}"`;   // double any inner quotes and wrap in quotes
}                                                    // end function

module.exports = escape_csv_field;                   // export the CSV-field escaper
