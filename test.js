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

    // Step 1: Basic pattern detection (minimal work)
    // Finds 2 letters, 2 digits, then 1-30 letters/digits.
    const ibanRegex = /\b[A-Z]{2}\d{2}[\dA-Z]{1,30}\b/gi;
    const potentialMatches = text.match(ibanRegex) || [];

    // Return all potential IBAN matches (maybe IBANs), normalized
    return potentialMatches.map(candidate => candidate.toUpperCase().replace(/\s/g, ''));
}


// Test code to check IBAN validity
let testIban = `مصرف الراجحي 

شركة اكبر للاستقدام 


المحاسب محمد شاهين الشهراني



640000010006086352979


رقم الايبان 

SA81 8000 0640 6080 1635 2979`;

// Test parser_iban on testIban only
console.log('parser_iban result (testIban only):', parser_iban(testIban));


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