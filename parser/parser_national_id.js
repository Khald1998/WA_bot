const { isValidSaudiID } = require('saudi-id-validator');  // import the Saudi ID/Iqama check-digit validator


function parser_national_id(text) {  // parse and validate national IDs found in a text string; parses and validates Saudi National ID / Iqama numbers from text
    if (typeof text !== 'string') {  // guard: only string input can be scanned; 1. validate input
        return [];  // non-string input yields no IDs
    }  // end input type guard

    const id_regex = /\b[\d٠١٢٣٤٥٦٧٨٩]{10}\b/g;  // regex for standalone 10-digit runs (Western or Arabic numerals); 2. find potential IDs: matches sequences of exactly 10 digits with word boundaries. this ensures the 10 digits are not part of a longer sequence (like IBANs). includes both Western (0-9) and Eastern Arabic (٠-٩) numerals
    const potential_matches = text.match(id_regex) || [];  // collect all 10-digit candidates, or empty array

    const valid_ids = [];  // accumulator for validated IDs; 3. validate each candidate and collect valid ones
    for (const candidate of potential_matches) {  // iterate over each 10-digit candidate
        if (isValidSaudiID(candidate)) {  // keep only candidates passing official validation; the library validates the number format and check digit
            valid_ids.push(candidate.replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)));  // normalize Arabic digits to Western and store; the library accepts various inputs, but we normalize to a string of Western digits. this ensures a consistent return format
        }  // end validity check
    }  // end candidate loop
    return valid_ids;  // return all validated national IDs; 4. return the list of validated IDs
}  // end parser_national_id

module.exports = parser_national_id;  // export the parser function
