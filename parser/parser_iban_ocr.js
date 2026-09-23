const ibantools = require('ibantools');  // IBAN mod-97 validation; OCR text needs confusion-map repair plus windowed matching to survive misreads and fused garbage

const FORMATTING_RE = /[\s\-\*\. 　]/g;  // separators stripped from each line (space, dash, asterisk, dot, full-width space)
const AR_DIGITS = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };  // Arabic-Indic to Western digit lookup
const CONFUSION = { O: '0', D: '0', Q: '0', I: '1', L: '1', Z: '2', S: '5', G: '6', T: '7', B: '8' };  // OCR letter-to-digit repair map, applied only after the country code and accepted only when the result validates
const SAUDI_BANKS = new Set(['05', '10', '15', '20', '30', '36', '45', '55', '60', '65', '78', '80', '90', '93', '95']);  // real Saudi bank codes (IBAN chars 5-6); gate that kills mod-97 flukes which almost never land on a valid code

const plausible = iban => !iban.startsWith('SA') || SAUDI_BANKS.has(iban.substr(4, 2));  // allow non-Saudi IBANs; require a real bank code for Saudi ones
const repair = s => s.slice(0, 2) + s.slice(2).replace(/[A-Z]/g, c => CONFUSION[c] || c);  // swap confusable letters to digits in the body after the country code

function try_candidate(candidate, found) {  // validate one candidate and add any valid IBAN (and its digit-repaired twin) to the set
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(candidate)) return;  // bail unless shaped as CC + 2 check digits + alphanumerics
    const letters = (candidate.slice(2).match(/[A-Z]/g) || []).length;  // count letters after the country code
    if (ibantools.isValidIBAN(candidate) && plausible(candidate)) {  // candidate passes mod-97 and the bank-code gate
        if (!candidate.startsWith('SA') || letters <= 2) found.add(candidate);  // accept unless it is a letter-heavy Saudi fluke (Saudi IBANs are letter-capped; KW/AE carry real 4-letter bank codes)
        if (letters === 0) return;  // pure-digit IBAN is final, skip repair
    }  // end valid-candidate branch
    const repaired = repair(candidate);  // rebuild the post-CC body with confusable letters swapped to digits
    if (repaired !== candidate && !/[A-Z]/.test(repaired.slice(2)) && ibantools.isValidIBAN(repaired) && plausible(repaired)) found.add(repaired);  // keep the digit-repaired IBAN when substitution left no letters and it validates
}  // end try_candidate

function parser_iban_ocr(text) {  // main entry: extract all valid IBANs from OCR text
    if (typeof text !== 'string') return [];  // guard against non-string input
    const found = new Set();  // collects unique validated IBANs
    const upper = text.replace(/[٠-٩]/g, c => AR_DIGITS[c]).toUpperCase();  // de-Arabize digits and fold to uppercase for case-insensitive matching
    const lines = upper.split(/[\r\n]+/).map(l => l.replace(FORMATTING_RE, ''));  // split into lines and strip separators from each
    for (const source of [...lines, lines.join('')]) {  // scan each stripped line and the joined blob of all lines
        for (const m of source.match(/[A-Z]{2}\d{2}[A-Z0-9]{1,30}/g) || []) try_candidate(m, found);  // test each greedy IBAN-shaped run
        for (let idx = source.indexOf('SA'); idx !== -1; idx = source.indexOf('SA', idx + 1)) {  // walk every 'SA' position for an exact SA+22 window recovering fused IBANs
            if (source.substr(idx, 24).length === 24) try_candidate(source.substr(idx, 24), found);  // test the full 24-char window
            if (/[A-Z]/.test(source[idx + 2] || '') && ('SA' + source.substr(idx + 3, 22)).length === 24) try_candidate('SA' + source.substr(idx + 3, 22), found);  // retry skipping a spurious letter OCR inserted right after the country code
        }  // end SA-window loop
        for (const m of source.match(/(?<!\d)\d{22}(?!\d)/g) || []) try_candidate('SA' + m, found);  // a bare 22-digit run is a Saudi IBAN whose 'SA' was dropped, so prepend it
    }  // end source loop
    for (const iban of [...found]) if (repair(iban) !== iban && found.has(repair(iban))) found.delete(iban);  // when a letter IBAN and its numeric twin both validated, keep only the repaired one
    return [...found];  // return the collected IBANs as an array
}  // end parser_iban_ocr

module.exports = parser_iban_ocr;  // export the parser function
