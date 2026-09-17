const ibantools = require('ibantools');  // IBAN validation library



function validate_ibans(ibans) {  // keep only checksum-valid IBANs, normalized
    // Accepts an array of IBAN candidates, returns only valid ones (normalized)
    const valid_ibans = [];  // accumulator for valid IBANs
    for (const candidate of ibans) {  // check each candidate string
        const normalized_iban = candidate.toUpperCase().replace(/\s/g, '');  // uppercase and strip whitespace
        if (ibantools.isValidIBAN(normalized_iban)) {  // does it pass IBAN checksum rules
            valid_ibans.push(normalized_iban);  // keep the valid normalized IBAN
        }  // end validity check
    }  // end candidate loop
    return valid_ibans;  // return the filtered valid IBANs
}  // end validate_ibans

const FORMATTING_RE = /[\s\-\*\u00A0\u3000]/g; // whitespace, dashes, asterisks
const IBAN_RE = /[A-Z]{2}\d{2}[A-Z0-9]{1,30}/g;  // rough IBAN shape: 2 letters, 2 digits, up to 30 alphanumerics

function parser_iban(text) {  // extract valid IBANs from arbitrary text
    if (typeof text !== 'string') {  // guard against non-string input
        return [];  // nothing to parse
    }  // end type guard

    const upper = text.toUpperCase();  // uppercase once for all strategies
    const candidates = [];  // collected IBAN candidate strings

    // Strategy 1: per-line matching. OCR text carries garbage on adjacent lines
    // that fuses with the IBAN once newlines are stripped \u2014 matching each line
    // on its own keeps the IBAN clean.
    for (const line of upper.split(/[\r\n]+/)) {  // process each line separately
        const clean = line.replace(FORMATTING_RE, '');  // strip whitespace/dashes/asterisks from the line
        candidates.push(...(clean.match(IBAN_RE) || []));  // add any IBAN matches from this line
    }  // end per-line loop

    // Strategy 2: fully joined text, for IBANs split across lines.
    const joined = upper.replace(FORMATTING_RE, '');  // whole text with all formatting stripped
    candidates.push(...(joined.match(IBAN_RE) || []));  // add IBAN matches from the joined text

    // Strategy 3: SA sliding window on the joined text. When garbage digits sit
    // directly before/after an IBAN, the greedy regex grabs an over-long match
    // that fails validation \u2014 taking exactly SA + 22 chars at every SA
    // occurrence recovers the real IBAN.
    let idx = -1;  // search cursor for 'SA' occurrences
    while ((idx = joined.indexOf('SA', idx + 1)) !== -1) {  // find each 'SA' start position
        const window = joined.substr(idx, 24);  // take SA + 22 chars (Saudi IBAN length)
        if (window.length === 24) candidates.push(window);  // keep only full-length windows
    }  // end sliding-window loop

    // Strategy 4: bare digit runs with no country code \u2014 prefix with 'SA'.
    if (candidates.length === 0) {  // only if nothing matched so far
        const alphanumeric_only = joined.replace(/[^A-Z0-9]/g, '');  // keep letters and digits only
        if (/^\d/.test(alphanumeric_only) && alphanumeric_only.length > 0) {  // starts with a digit (no country code)
            candidates.push(...(('SA' + alphanumeric_only).match(IBAN_RE) || []));  // prefix 'SA' then match IBANs
        }  // end digit-run check
    }  // end fallback block

    const well_formed = candidates.filter(iban => /^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban));  // drop structurally malformed candidates
    return [...new Set(validate_ibans(well_formed))];  // validate, dedupe, and return
}  // end parser_iban

module.exports = parser_iban;  // export the parser function