// One line per bill: "<sadad_number>,<sadad_type>," — mirrors generate_iban_txt.
function generate_sadad_txt(records) {
  return records.map(r => `${r.sadad_number},${r.sadad_type},`).join('\n');
}

module.exports = generate_sadad_txt;
