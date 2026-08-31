const ibantools = require('ibantools');



function validate_ibans(ibans) {
    // Accepts an array of IBAN candidates, returns only valid ones (normalized)
    const valid_ibans = [];
    for (const candidate of ibans) {
        const normalized_iban = candidate.toUpperCase().replace(/\s/g, '');
        if (ibantools.isValidIBAN(normalized_iban)) {
            valid_ibans.push(normalized_iban);
        }
    }
    return valid_ibans;
}

const FORMATTING_RE = /[\s\-\*\u00A0\u3000]/g; // whitespace, dashes, asterisks
const IBAN_RE = /[A-Z]{2}\d{2}[A-Z0-9]{1,30}/g;

function parser_iban(text) {
    if (typeof text !== 'string') {
        return [];
    }

    const upper = text.toUpperCase();
    const candidates = [];

    // Strategy 1: per-line matching. OCR text carries garbage on adjacent lines
    // that fuses with the IBAN once newlines are stripped \u2014 matching each line
    // on its own keeps the IBAN clean.
    for (const line of upper.split(/[\r\n]+/)) {
        const clean = line.replace(FORMATTING_RE, '');
        candidates.push(...(clean.match(IBAN_RE) || []));
    }

    // Strategy 2: fully joined text, for IBANs split across lines.
    const joined = upper.replace(FORMATTING_RE, '');
    candidates.push(...(joined.match(IBAN_RE) || []));

    // Strategy 3: SA sliding window on the joined text. When garbage digits sit
    // directly before/after an IBAN, the greedy regex grabs an over-long match
    // that fails validation \u2014 taking exactly SA + 22 chars at every SA
    // occurrence recovers the real IBAN.
    let idx = -1;
    while ((idx = joined.indexOf('SA', idx + 1)) !== -1) {
        const window = joined.substr(idx, 24);
        if (window.length === 24) candidates.push(window);
    }

    // Strategy 4: bare digit runs with no country code \u2014 prefix with 'SA'.
    if (candidates.length === 0) {
        const alphanumeric_only = joined.replace(/[^A-Z0-9]/g, '');
        if (/^\d/.test(alphanumeric_only) && alphanumeric_only.length > 0) {
            candidates.push(...(('SA' + alphanumeric_only).match(IBAN_RE) || []));
        }
    }

    const well_formed = candidates.filter(iban => /^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban));
    return [...new Set(validate_ibans(well_formed))];
}

module.exports = parser_iban;