const ibantools = require('ibantools');  // IBAN validation library
const FORMATTING_RE = /[\s\-\* 　]/g;  // whitespace, dashes, asterisks
const IBAN_RE = /[A-Z]{2}\d{2}[A-Z0-9]{1,30}/g;  // rough IBAN shape: 2 letters, 2 digits, up to 30 alphanumerics
function parser_iban(text) {  // extract valid IBANs from arbitrary text
    if (typeof text !== 'string') return [];  // guard against non-string input; nothing to parse
    const upper = text.toUpperCase(), joined = upper.replace(FORMATTING_RE, '');  // uppercase once; and a fully formatting-stripped copy (strategy 2 fuel, for IBANs split across lines)
    const candidates = upper.split(/[\r\n]+/).flatMap(line => line.replace(FORMATTING_RE, '').match(IBAN_RE) || []);  // strategy 1: per-line matching keeps OCR garbage on adjacent lines from fusing with the IBAN once newlines are stripped
    candidates.push(...(joined.match(IBAN_RE) || []));  // strategy 2: add IBAN matches from the fully joined text
    for (let idx = -1; (idx = joined.indexOf('SA', idx + 1)) !== -1; ) { const window = joined.substr(idx, 24); if (window.length === 24) candidates.push(window); }  // strategy 3: at every SA take exactly SA + 22 chars (Saudi IBAN length) to recover IBANs the greedy regex over-grabs when garbage digits abut them
    if (candidates.length === 0) { const alphanumeric_only = joined.replace(/[^A-Z0-9]/g, ''); if (/^\d/.test(alphanumeric_only)) candidates.push(...(('SA' + alphanumeric_only).match(IBAN_RE) || [])); }  // strategy 4: only if nothing matched, treat a bare digit run (no country code) by prefixing 'SA'
    const valid_ibans = [];  // accumulator for structurally sound, checksum-valid, de-duplicated IBANs (candidates are already uppercase and whitespace-free, so each is its own normalized form)
    for (const iban of candidates) if (/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban) && ibantools.isValidIBAN(iban) && !valid_ibans.includes(iban)) valid_ibans.push(iban);  // drop malformed, validate checksum, dedupe preserving first-occurrence order
    return valid_ibans;  // return the filtered valid IBANs
}  // end parser_iban
module.exports = parser_iban;  // export the parser function
