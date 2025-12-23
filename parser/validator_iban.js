// parser/validator_iban.js
// Validates IBAN numbers using ibantools library.
const ibantools = require('ibantools');

/**
 * Validates if a given string is a valid IBAN.
 * @param {string} iban - The IBAN string to validate (will be normalized internally)
 * @returns {boolean} - True if valid IBAN, false otherwise
 */
function validator_iban(iban) {
    if (typeof iban !== 'string') {
        return false;
    }

    // Clean and normalize the IBAN
    const normalizedIban = iban.toUpperCase().replace(/\s/g, '');

    // Use ibantools to perform full ISO validation
    return ibantools.isValidIBAN(normalizedIban);
}

module.exports = validator_iban;
