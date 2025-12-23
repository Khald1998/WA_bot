// parser/parser_iban.js
// Parses and validates IBAN numbers from text.
const ibantools = require('ibantools');
const IBAN = require('iban');
const { isValid: ibanValidatorJs } = require('iban-validator-js');
const { IBAN: IbankitIBAN } = require('ibankit');
const validator = require('validator');


function validateIban(iban) {
    // Normalize the IBAN
    const normalizedIban = iban.toUpperCase().replace(/\s/g, '');

    // Check with multiple validators - OR condition (valid if any confirms)
    let isValid = 
        ibantools.isValidIBAN(normalizedIban) ||
        IBAN.isValid(normalizedIban) ||
        ibanValidatorJs(normalizedIban) ||
        validator.isIBAN(normalizedIban);
    
    // ibankit uses try-catch for validation
    if (!isValid) {
        try {
            new IbankitIBAN(normalizedIban);
            isValid = true;
        } catch (e) {
            // Invalid IBAN
        }
    }

    return isValid;
}

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
    
    return potentialMatches;
}



console.log('\n=== Direct Validation Tests ===');
// Fixed form is SA8180000640608016352979
const validationTests = [
    'SA81 8000 0640 6080 1635 2979', // (accept it and fix it) Saudi IBAN
    'SA8180000640608016352979', // (accept only) Same without spaces
    'SA81 8000 0640 6080 1635 29', // (accept only) Too short
    'SA81 8000 0640 6080 1635 2979 123', //(accept only) Too long
    'SA81 8000 0640 6080 1635 29#9', // (reject it) character
    '1234 5678 9012 3456 7890', // (accept it and fix it) No country code
    'SA81 8000 0640 6080 1635 2979  ', //(accept it and fix it) With trailing spaces
    '  SA81 8000 0640 6080 1635 2979  ', // (accept it and fix it) With surrounding spaces
    'SA81-8000-0640-6080-1635-2979', // (accept it and fix it) characters but wrong separator
    'SA81 8000  0640  6080  1635  2979', //(accept it and fix it) Multiple spaces between groups
    'sa81 8000 0640 6080 1635 2979', //(accept it and fix it) Lowercase country code
    'SA81 8000 0640 6080 1635 2979\n', //(accept it and fix it) With newline character
    'SA\t81 8000 0640 6080 1635 2979', //(accept it and fix it) With tab character
    'SA81 8000 0640 6080 1635 2979 0', //(accept only) Extra digit at end
    '0SA81 8000 0640 6080 1635 2979', //(accept it and fix it) Leading digit
    'SA81 8000 0640 6080 1635 2979 ', //(accept it and fix it) Trailing single space
    ' SA81 8000 0640 6080 1635 2979', //(accept it and fix it) Leading single space
    'SA81 8000 0640 6080 1635 2979\u3000', //(accept it and fix it) With ideographic space (non-standard)
    'SA81\u00A08000\u00A00640\u00A06080\u00A01635\u00A02979', //(accept it and fix it) With non-breaking spaces
];

validationTests.forEach(iban => {
    const parsedIbans = parser_iban(iban);
    const isValid = parsedIbans.length > 0 ? validateIban(parsedIbans[0]) : false;
    console.log(`${iban.padEnd(40)}:`, parsedIbans.length > 0 ? parsedIbans : 'No IBAN found', '| Valid:', isValid);
});


// console.log('Is valid (ibantools):', ibantools.isValidIBAN(testIban));
// console.log('Is valid (iban):', IBAN.isValid(testIban));
// console.log('Is valid (iban-validator-js):', ibanValidatorJs(testIban));
// try {
//     new IbankitIBAN(testIban);
//     console.log('Is valid (ibankit):', true);
// } catch (e) {
//     console.log('Is valid (ibankit):', false, '-', e.message);
// }
// console.log('Is valid (validator):', validator.isIBAN(testIban));



module.exports = parser_iban;