function generate_iban_txt(records) {  // build the IBAN .txt body from all IBAN records
  return records.map(r => `${r.iban_number},`).join('\n');  // format each IBAN as "number," and join with newlines
}  // end generate_iban_txt

module.exports = generate_iban_txt;  // export the IBAN txt generator function
