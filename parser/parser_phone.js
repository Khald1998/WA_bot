const { findPhoneNumbersInText, parsePhoneNumberFromString } = require('libphonenumber-js');  // phone-number extractor + single-number parser from libphonenumber-js; module parses and extracts phone numbers from text using libphonenumber-js

const SAUDI_MOBILE_RE = /(?<!\d)(?:(?:\+|00)?966[\s-]?|0)5\d{8}(?!\d)/g;  // glued-mobile recovery pattern; Bounded Saudi MOBILE token used as a fallback scan. findPhoneNumbersInText treats ')' and '-' as phone-internal separators, so a mobile glued to a list marker with no space (e.g. "3)0543294683", "0591648564-1", or two numbers dash-joined "0598547667-0583229298") becomes an over-length token that fails validation and is silently dropped. This regex matches a mobile only when it is a bounded standalone token: a (+966|00966|966|0) prefix, then 5 + 8 digits, with a non-digit (or string edge) on both sides. It matches mobiles ONLY (starts with 5), so it never introduces landline/toll-free noise.

function to_ascii_digits(text) {  // convert Eastern-Arabic digits to ASCII 0-9; Normalise Arabic-Indic (٠-٩ U+0660-0669) and Extended Arabic-Indic (۰-۹ U+06F0-06F9) digits to ASCII so the fallback regex can see numbers typed in Eastern-Arabic numerals.
    let out = '';  // accumulator for the converted string
    for (const ch of text) {  // walk the input one code point at a time
        const code = ch.codePointAt(0);  // numeric code point of the current character
        if (code >= 0x0660 && code <= 0x0669) out += String(code - 0x0660);  // map Arabic-Indic digit to ASCII
        else if (code >= 0x06F0 && code <= 0x06F9) out += String(code - 0x06F0);  // map Extended Arabic-Indic digit to ASCII
        else out += ch;  // keep every other character unchanged
    }  // end per-character loop
    return out;  // return the digit-normalised string
}  // end to_ascii_digits

function parser_phone(text) {  // extract phone numbers from a text string; Extracts all phone numbers found within a text string. @param {string} text - The input text to search for phone numbers. @returns {Array<string>} An array of phone numbers in international format (e.g., "+966 50 123 4567"). Returns an empty array if no valid numbers are found.
    if (typeof text !== 'string') {  // step 1 validate input: reject non-string input
        return [];  // return an empty list for invalid input
    }  // end input guard

    const primary = findPhoneNumbersInText(text, { defaultCountry: 'SA' })  // find numbers, defaulting to Saudi Arabia; step 2 primary pass: find all phone numbers the library can see. The second parameter is a default country code hint ('SA' for Saudi Arabia) so local numbers are interpreted correctly.
        .map(match => match.number.formatInternational());  // format each match to international form

    const fallback = [];  // recovered mobiles the primary pass missed; step 3 fallback pass: recover Saudi mobiles glued to list punctuation that the primary pass drops. Scan the digit-normalised text for bounded mobile tokens and re-validate each one so only genuine Saudi mobiles are kept (11-digit typos and non-mobile numbers are rejected here).
    for (const match of to_ascii_digits(text).matchAll(SAUDI_MOBILE_RE)) {  // iterate every bounded mobile token
        const parsed = parsePhoneNumberFromString(match[0], 'SA');  // parse the candidate as a Saudi number
        if (parsed && parsed.isValid()) fallback.push(parsed.formatInternational());  // keep it only if it is a valid number
    }  // end fallback scan

    const seen = new Set();  // tracks numbers already emitted; step 4 union the two passes, preserving first-seen order and de-duplicating by formatted value.
    const extracted_numbers = [];  // final ordered, de-duplicated result
    for (const number of [...primary, ...fallback]) {  // walk primary matches first, then fallback recoveries
        if (!seen.has(number)) {  // skip any number already collected
            seen.add(number);  // mark this number as seen
            extracted_numbers.push(number);  // add the new number to the result
        }  // end de-dup guard
    }  // end union loop

    return extracted_numbers;  // return the collected phone numbers; step 5 return the list of numbers
}  // end parser_phone function

module.exports = parser_phone;  // export the parser
