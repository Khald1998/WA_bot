// parser/parser_iban.js
// Parses IBAN numbers from text.
const validator_iban = require('./validator_iban');


function parser_iban(text) {
    if (typeof text !== 'string') {
        return [];
    }

    // Step 1: Remove acceptable formatting characters (all whitespace types and dashes)
    let cleanedText = text
        .replace(/[-\s\t\n\r\u00A0\u3000]/g, '') // Remove spaces, tabs, newlines, non-breaking spaces, ideographic spaces, and dashes
        .toUpperCase();
    
    // Step 2: Check for invalid characters (only A-Z and 0-9 allowed in IBAN)
    if (/[^A-Z0-9]/.test(cleanedText)) {
        return []; // Reject if any invalid characters found (like #)
    }
    
    // Step 3: Special case - if it starts with digits (no country code), prefix with 'SA'
    if (/^\d/.test(cleanedText)) {
        cleanedText = 'SA' + cleanedText;
    }
    
    // Step 4: Find IBAN patterns (2 letters + 2 digits + 1-30 alphanumerics)
    const ibanRegex = /[A-Z]{2}\d{2}[A-Z0-9]{1,30}/g;
    const potentialMatches = cleanedText.match(ibanRegex) || [];
    
    // Step 5: Validate candidates using the validator
    const validIbans = [];
    for (const candidate of potentialMatches) {
        if (validator_iban(candidate)) {
            validIbans.push(candidate);
        }
    }
    
    return validIbans;
}

module.exports = parser_iban;