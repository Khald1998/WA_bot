const ibantools = require('ibantools');  // IBAN validation library (mod-97 checksum + country rules) — IBAN extraction tuned for OCR output (image text). OCR text differs from typed text in two ways this parser must survive: 1. Garbage on adjacent lines (timestamps, misread symbols) that fuses with the IBAN once whitespace is stripped — handled by line-based matching plus an exact SA+22 sliding window. 2. Character misreads inside the IBAN itself (1→L, 0→O, 8→B ...) — handled by confusion-map substitution, accepted only when the substituted IBAN passes mod-97 check-digit validation, so a wrong guess cannot produce a reportable IBAN.

const FORMATTING_RE = /[\s\-\*\. 　]/g;  // matches separators (space, dash, asterisk, dot, full-width space) to strip
const AR_DIGITS = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };  // Arabic-Indic to Western digit lookup

const CONFUSION = { O: '0', D: '0', Q: '0', I: '1', L: '1', Z: '2', S: '5', G: '6', T: '7', B: '8' };  // OCR letter-to-digit repair map — Common OCR digit misreads. Only ever applied to the part AFTER the SA country code, and only accepted when the result validates.

function normalize(text) {  // uppercase and de-Arabize the raw OCR text
    return text  // begin the normalized-string chain on the input
        .replace(/[٠-٩]/g, c => AR_DIGITS[c])  // convert each Arabic-Indic digit to Western
        .toUpperCase();  // fold to uppercase for case-insensitive matching
}  // end normalize

const SAUDI_BANKS = new Set(['05', '10', '15', '20', '30', '36', '45', '55', '60', '65', '78', '80', '90', '93', '95']);  // known valid Saudi bank codes — Saudi bank codes (IBAN chars 5-6) seen across 12k+ captured IBANs. OCR digit runs pass mod-97 by fluke ~1/97 of the time; a fabricated candidate almost never lands on a real bank code, so this gate kills flukes.

function plausible(iban) {  // gate a candidate on Saudi bank-code membership
    return !iban.startsWith('SA') || SAUDI_BANKS.has(iban.substr(4, 2));  // allow non-Saudi IBANs; require a real bank code for Saudi ones
}  // end plausible

function try_candidate(candidate, found) {  // validate one candidate and add any valid IBAN to the set
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(candidate)) return;  // bail unless shaped as CC + 2 check digits + alphanumerics

    if (ibantools.isValidIBAN(candidate) && plausible(candidate)) {  // candidate passes mod-97 and the bank-code gate
        const letters = (candidate.slice(2).match(/[A-Z]/g) || []).length;  // count letters after the country code
        if (!candidate.startsWith('SA') || letters <= 2) found.add(candidate);  // accept unless it is a letter-heavy Saudi fluke — A pile of letters that still passes mod-97 is a 1-in-97 OCR fluke (e.g. "SA8764ALRAJHIBANKJLGLTOI"), not an account number. Only Saudi IBANs are letter-capped — other countries (KW, AE) legitimately carry a 4-letter bank code.
        if (letters === 0) return;  // pure-digit IBAN is final, skip repair
    }  // end valid-candidate branch

    const body = candidate.slice(2).replace(/[A-Z]/g, c => CONFUSION[c] || c);  // rebuild post-CC body with confusable letters swapped to digits — Misread recovery: substitute confusable letters after the country code and keep the result only if the check digits agree.
    const repaired = candidate.slice(0, 2) + body;  // reattach the country code to the repaired body
    const leftover = (body.match(/[A-Z]/g) || []).length;  // count letters left after substitution
    if (repaired !== candidate && leftover === 0  // only if substitution changed it and left no letters
        && ibantools.isValidIBAN(repaired) && plausible(repaired)) {  // and the repaired IBAN validates and is plausible
        found.add(repaired);  // keep the digit-repaired IBAN
    }  // end repair branch
}  // end try_candidate

function parser_iban_ocr(text) {  // main entry: extract all valid IBANs from OCR text
    if (typeof text !== 'string') return [];  // guard against non-string input

    const found = new Set();  // collects unique validated IBANs
    const upper = normalize(text);  // normalized uppercase, Western-digit text
    const lines = upper.split(/[\r\n]+/).map(l => l.replace(FORMATTING_RE, ''));  // split into lines and strip separators from each
    const joined = lines.join('');  // one continuous string of all stripped lines

    for (const source of [...lines, joined]) {  // scan each line and the joined blob
        for (const m of source.match(/[A-Z]{2}\d{2}[A-Z0-9]{1,30}/g) || []) {  // find greedy IBAN-shaped runs
            try_candidate(m, found);  // test each run
        }  // end greedy-match loop
        let idx = -1;  // sliding search index for 'SA' occurrences — Exact SA+22 window at every SA occurrence — recovers IBANs fused with surrounding digits that the greedy match above over-extends.
        while ((idx = source.indexOf('SA', idx + 1)) !== -1) {  // walk every 'SA' position
            const window = source.substr(idx, 24);  // take an exact SA + 22 window
            if (window.length === 24) try_candidate(window, found);  // test it when full length
            if (/[A-Z]/.test(source[idx + 2] || '')) {  // if a stray letter follows the country code — OCR sometimes inserts a spurious letter right after the country code ("SAO03 8000..." for SA03 8000...) — retry with it skipped.
                const skipped = 'SA' + source.substr(idx + 3, 22);  // rebuild the window skipping that letter
                if (skipped.length === 24) try_candidate(skipped, found);  // test the skipped-letter window
            }  // end stray-letter retry
        }  // end SA-window loop
        for (const m of source.match(/(?<!\d)\d{22}(?!\d)/g) || []) {  // find bare 22-digit runs (country code dropped) — A line that is a bare 22-digit run is a Saudi IBAN missing its country code (OCR often drops the "SA").
            try_candidate('SA' + m, found);  // prepend SA and test
        }  // end bare-digit loop
    }  // end source loop

    for (const iban of [...found]) {  // revisit each collected IBAN to dedup twins — If both a letter-bearing IBAN and its digit-repaired twin validated, keep only the repaired (numeric) one — the letter was the misread.
        const body = iban.slice(2).replace(/[A-Z]/g, c => CONFUSION[c] || c);  // compute its digit-repaired body
        const repaired = iban.slice(0, 2) + body;  // form the repaired twin
        if (repaired !== iban && found.has(repaired)) found.delete(iban);  // drop the letter version when its numeric twin exists
    }  // end dedup loop

    return [...found];  // return the collected IBANs as an array
}  // end parser_iban_ocr

module.exports = parser_iban_ocr;  // export the parser function
