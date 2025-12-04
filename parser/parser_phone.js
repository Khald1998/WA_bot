// parser/parser_phone.js
// Parses and extracts phone numbers from text using libphonenumber-js

const { findPhoneNumbersInText } = require('libphonenumber-js');

/**
 * Extracts all phone numbers found within a text string.
 * @param {string} text - The input text to search for phone numbers.
 * @returns {Array<string>} An array of phone numbers in E.164 international format (e.g., "+966501234567").
 *                          Returns an empty array if no valid numbers are found.
 */
function parser_phone(text) {
    // 1. Validate input
    if (typeof text !== 'string') {
        return [];
    }

    // 2. Find all phone numbers in the text
    //    The second parameter is a default country code hint (e.g., 'SA' for Saudi Arabia).
    //    This helps interpret local numbers. Use undefined for strict international detection.
    const phoneMatches = findPhoneNumbersInText(text, { defaultCountry: 'SA' });

    // 3. Extract and format the numbers
    const extractedNumbers = phoneMatches.map(match => {
        // The `number` property is a PhoneNumber object
        // Its `formatInternational()` method returns the standard E.164 format
        return match.number.formatInternational();
    });

    // 4. Return the list of numbers
    return extractedNumbers;
}

module.exports = parser_phone;