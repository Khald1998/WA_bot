// parser/parser_national_id.js
// Parses and validates Saudi National ID / Iqama numbers from text.
const { isValidSaudiID } = require('saudi-id-validator');  // import the Saudi ID/Iqama check-digit validator


function parser_national_id(text) {  // parse and validate national IDs found in a text string
    // 1. Validate input
    if (typeof text !== 'string') {  // guard: only string input can be scanned
        return [];  // non-string input yields no IDs
    }  // end input type guard

    // 2. Find potential IDs: Matches sequences of exactly 10 digits with word boundaries.
    // This ensures the 10 digits are not part of a longer sequence (like IBANs).
    // Includes both Western (0-9) and Eastern Arabic (٠-٩) numerals.
    const id_regex = /\b[\d٠١٢٣٤٥٦٧٨٩]{10}\b/g;  // regex for standalone 10-digit runs (Western or Arabic numerals)
    const potential_matches = text.match(id_regex) || [];  // collect all 10-digit candidates, or empty array

    // 3. Validate each candidate and collect valid ones
    const valid_ids = [];  // accumulator for validated IDs
    for (const candidate of potential_matches) {  // iterate over each 10-digit candidate
        // The library validates the number format and check digit.
        if (isValidSaudiID(candidate)) {  // keep only candidates passing official validation
            // The library accepts various inputs, but we normalize to a string of Western digits.
            // This ensures a consistent return format.
            valid_ids.push(candidate.replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)));  // normalize Arabic digits to Western and store
        }  // end validity check
    }  // end candidate loop
    // 4. Return the list of validated IDs
    return valid_ids;  // return all validated national IDs
}  // end parser_national_id

module.exports = parser_national_id;  // export the parser function