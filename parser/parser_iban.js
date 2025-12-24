// // parser/parser_iban.js
// // Parses IBAN numbers from text.
// const validator_iban = require('./validator_iban');


// function parser_iban(text) {
//     if (typeof text !== 'string') {
//         return [];
//     }

//     // Step 1: Remove acceptable formatting characters (all whitespace types and dashes)
//     let cleanedText = text
//         .trim()                    // Remove leading/trailing whitespace
//         .replace(/-/g, '')         // Remove dashes
//         .replace(/\*/g, '')        // Remove asterisks
//         .replace(/ /g, '')         // Remove spaces
//         .replace(/\t/g, '')        // Remove tabs
//         .replace(/\n/g, '')        // Remove newlines
//         .replace(/\r/g, '')        // Remove carriage returns
//         .replace(/\u00A0/g, '')    // Remove non-breaking spaces
//         .replace(/\u3000/g, '')    // Remove ideographic spaces
//         .toUpperCase();
    
//     // Step 2: Find IBAN patterns (2 letters + 2 digits + 1-30 alphanumerics)
//     const ibanRegex = /[A-Z]{2}\d{2}[A-Z0-9]{1,30}/g;
//     let potentialMatches = cleanedText.match(ibanRegex) || [];
    
//     // Step 3: If no matches found and text contains only valid IBAN chars starting with digits,
//     // try prefixing with 'SA' (Saudi Arabia)
//     if (potentialMatches.length === 0) {
//         // Extract only alphanumeric characters for the fallback check
//         const alphanumericOnly = cleanedText.replace(/[^A-Z0-9]/g, '');
        
//         // If it starts with digits (no country code), prefix with 'SA'
//         if (/^\d/.test(alphanumericOnly) && alphanumericOnly.length > 0) {
//             const withPrefix = 'SA' + alphanumericOnly;
//             potentialMatches = withPrefix.match(ibanRegex) || [];
//         }
//     }
    
//     // Step 4: Filter out matches that contain invalid characters
//     // This check is now per-match, not for the whole text
//     potentialMatches = potentialMatches.filter(iban => {
//         return /^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban);
//     });
    
//     // Step 5: Validate candidates using the validator
//     const validIbans = [];
//     for (const candidate of potentialMatches) {
//         if (validator_iban(candidate)) {
//             validIbans.push(candidate);
//         }
//     }
    
//     return validIbans;
// }

// module.exports = parser_iban;


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