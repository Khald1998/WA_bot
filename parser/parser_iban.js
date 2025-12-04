// parser/parser_iban.js
// Parses and validates IBAN numbers from text.
const ibantools = require('ibantools');


function parser_iban(text) {
    if (typeof text !== 'string') {
        return [];
    }

    // Step 1: Basic pattern detection (minimal work)
    // Finds 2 letters, 2 digits, then 1-30 letters/digits.
    const ibanRegex = /\b[A-Z]{2}\d{2}[\dA-Z]{1,30}\b/gi;
    const potentialMatches = text.match(ibanRegex) || [];

    // Step 2: Let the library do all the hard validation work
    const validIbans = [];
    for (const candidate of potentialMatches) {
        // Clean the candidate for validation
        const normalizedIban = candidate.toUpperCase().replace(/\s/g, '');

        // ibantools performs the full ISO validation check[citation:5]
        if (ibantools.isValidIBAN(normalizedIban)) {
            validIbans.push(normalizedIban);
        }
    }
    return validIbans;
}

module.exports = parser_iban;