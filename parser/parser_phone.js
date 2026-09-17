// parser/parser_phone.js
// Parses and extracts phone numbers from text using libphonenumber-js

const { findPhoneNumbersInText } = require('libphonenumber-js');  // phone-number extractor from libphonenumber-js

/**
 * Extracts all phone numbers found within a text string.
 * @param {string} text - The input text to search for phone numbers.
 * @returns {Array<string>} An array of phone numbers in E.164 international format (e.g., "+966501234567").
 *                          Returns an empty array if no valid numbers are found.
 */
function parser_phone(text) {  // extract phone numbers from a text string
    // 1. Validate input
    if (typeof text !== 'string') {  // reject non-string input
        return [];  // return an empty list for invalid input
    }  // end input guard

    // 2. Find all phone numbers in the text
    //    The second parameter is a default country code hint (e.g., 'SA' for Saudi Arabia).
    //    This helps interpret local numbers. Use undefined for strict international detection.
    const phone_matches = findPhoneNumbersInText(text, { defaultCountry: 'SA' });  // find numbers, defaulting to Saudi Arabia

    // 3. Extract and format the numbers
    const extracted_numbers = phone_matches.map(match => {  // map each match to a formatted string
        // The `number` property is a PhoneNumber object
        // Its `formatInternational()` method returns the standard E.164 format
        return match.number.formatInternational();  // format the number to international form
    });  // end map over matches

    // 4. Return the list of numbers
    return extracted_numbers;  // return the collected phone numbers
}  // end parser_phone function

module.exports = parser_phone;  // export the parser