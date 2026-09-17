// One line per bill: "<sadad_number>,<sadad_type>," — mirrors generate_iban_txt.
function generate_sadad_txt(records) {  // build the SADAD .txt body from all bill records
  return records.map(r => `${r.sadad_number},${r.sadad_type},`).join('\n');  // format each bill as "number,type," and join with newlines
}  // end generate_sadad_txt

module.exports = generate_sadad_txt;  // export the SADAD txt generator function
