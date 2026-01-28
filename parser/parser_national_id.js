// parser/parser_national_id.js
// Parses and validates Saudi National ID / Iqama numbers from text.
const { isValidSaudiID } = require('saudi-id-validator');


function parser_national_id(text) {
    // 1. Validate input
    if (typeof text !== 'string') {
        return [];
    }

    // 2. Find potential IDs: Matches sequences of exactly 10 digits with word boundaries.
    // This ensures the 10 digits are not part of a longer sequence (like IBANs).
    // Includes both Western (0-9) and Eastern Arabic (٠-٩) numerals.
    const idRegex = /\b[\d٠١٢٣٤٥٦٧٨٩]{10}\b/g;
    const potentialMatches = text.match(idRegex) || [];

    // 3. Validate each candidate and collect valid ones
    const validIds = [];
    for (const candidate of potentialMatches) {
        // The library validates the number format and check digit.
        if (isValidSaudiID(candidate)) {
            // The library accepts various inputs, but we normalize to a string of Western digits.
            // This ensures a consistent return format.
            validIds.push(candidate.replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
        }
    }
    // 4. Return the list of validated IDs
    return validIds;
}

module.exports = parser_national_id;