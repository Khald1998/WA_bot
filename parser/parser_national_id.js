const { isValidSaudiID } = require('saudi-id-validator');  // import the Saudi ID/Iqama check-digit validator

function parser_national_id(text) {  // parse and validate Saudi National ID / Iqama numbers from a text string
    if (typeof text !== 'string') return [];  // guard: non-string input yields no IDs
    return (text.match(/\b[\d٠١٢٣٤٥٦٧٨٩]{10}\b/g) || [])  // find standalone 10-digit runs (Western or Arabic numerals), or empty; word boundaries keep them out of longer sequences like IBANs
        .filter(c => isValidSaudiID(c))  // keep only candidates passing the library's format + check-digit validation
        .map(c => c.replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)));  // normalize Arabic digits to Western for a consistent return format
}  // end parser_national_id

module.exports = parser_national_id;  // export the parser function
