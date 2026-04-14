function generate_iban_txt(records) {
  return records.map(r => `${r.iban_number},`).join('\n');
}

module.exports = generate_iban_txt;
