// parser/parser_iban_ocr.js
// IBAN extraction tuned for OCR output (image text).
//
// OCR text differs from typed text in two ways this parser must survive:
//  1. Garbage on adjacent lines (timestamps, misread symbols) that fuses with
//     the IBAN once whitespace is stripped — handled by line-based matching
//     plus an exact SA+22 sliding window.
//  2. Character misreads inside the IBAN itself (1→L, 0→O, 8→B ...) — handled
//     by confusion-map substitution, accepted only when the substituted IBAN
//     passes mod-97 check-digit validation, so a wrong guess cannot produce a
//     reportable IBAN.

const ibantools = require('ibantools');

const FORMATTING_RE = /[\s\-\*\. 　]/g;
const AR_DIGITS = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };

// Common OCR digit misreads. Only ever applied to the part AFTER the SA
// country code, and only accepted when the result validates.
const CONFUSION = { O: '0', D: '0', Q: '0', I: '1', L: '1', Z: '2', S: '5', G: '6', T: '7', B: '8' };

function normalize(text) {
    return text
        .replace(/[٠-٩]/g, c => AR_DIGITS[c])
        .toUpperCase();
}

// Saudi bank codes (IBAN chars 5-6) seen across 12k+ captured IBANs. OCR digit
// runs pass mod-97 by fluke ~1/97 of the time; a fabricated candidate almost
// never lands on a real bank code, so this gate kills flukes.
const SAUDI_BANKS = new Set(['05', '10', '15', '20', '30', '36', '45', '55', '60', '65', '78', '80', '90', '93', '95']);

function plausible(iban) {
    return !iban.startsWith('SA') || SAUDI_BANKS.has(iban.substr(4, 2));
}

function try_candidate(candidate, found) {
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(candidate)) return;

    if (ibantools.isValidIBAN(candidate) && plausible(candidate)) {
        const letters = (candidate.slice(2).match(/[A-Z]/g) || []).length;
        // A pile of letters that still passes mod-97 is a 1-in-97 OCR fluke
        // (e.g. "SA8764ALRAJHIBANKJLGLTOI"), not an account number. Only Saudi
        // IBANs are letter-capped — other countries (KW, AE) legitimately
        // carry a 4-letter bank code.
        if (!candidate.startsWith('SA') || letters <= 2) found.add(candidate);
        if (letters === 0) return;
    }

    // Misread recovery: substitute confusable letters after the country code
    // and keep the result only if the check digits agree.
    const body = candidate.slice(2).replace(/[A-Z]/g, c => CONFUSION[c] || c);
    const repaired = candidate.slice(0, 2) + body;
    const leftover = (body.match(/[A-Z]/g) || []).length;
    if (repaired !== candidate && leftover === 0
        && ibantools.isValidIBAN(repaired) && plausible(repaired)) {
        found.add(repaired);
    }
}

function parser_iban_ocr(text) {
    if (typeof text !== 'string') return [];

    const found = new Set();
    const upper = normalize(text);
    const lines = upper.split(/[\r\n]+/).map(l => l.replace(FORMATTING_RE, ''));
    const joined = lines.join('');

    for (const source of [...lines, joined]) {
        for (const m of source.match(/[A-Z]{2}\d{2}[A-Z0-9]{1,30}/g) || []) {
            try_candidate(m, found);
        }
        // Exact SA+22 window at every SA occurrence — recovers IBANs fused
        // with surrounding digits that the greedy match above over-extends.
        let idx = -1;
        while ((idx = source.indexOf('SA', idx + 1)) !== -1) {
            const window = source.substr(idx, 24);
            if (window.length === 24) try_candidate(window, found);
            // OCR sometimes inserts a spurious letter right after the country
            // code ("SAO03 8000..." for SA03 8000...) — retry with it skipped.
            if (/[A-Z]/.test(source[idx + 2] || '')) {
                const skipped = 'SA' + source.substr(idx + 3, 22);
                if (skipped.length === 24) try_candidate(skipped, found);
            }
        }
        // A line that is a bare 22-digit run is a Saudi IBAN missing its
        // country code (OCR often drops the "SA").
        for (const m of source.match(/(?<!\d)\d{22}(?!\d)/g) || []) {
            try_candidate('SA' + m, found);
        }
    }

    // If both a letter-bearing IBAN and its digit-repaired twin validated,
    // keep only the repaired (numeric) one — the letter was the misread.
    for (const iban of [...found]) {
        const body = iban.slice(2).replace(/[A-Z]/g, c => CONFUSION[c] || c);
        const repaired = iban.slice(0, 2) + body;
        if (repaired !== iban && found.has(repaired)) found.delete(iban);
    }

    return [...found];
}

module.exports = parser_iban_ocr;
