// parser/parser_sadad_ocr.js
// SADAD extraction tuned for OCR (image) text.
//
// NOT WIRED into the pipeline yet — standalone module. Wire it in
// services/PFG_bussiness_logic.js (feed ocr_image text) when ready.
//
// SADAD bill numbers have NO check digit, so an OCR misread can't be detected or
// repaired — this parser never guesses digits. Two guards keep OCR output clean:
//
//  1. Strip phone numbers. Chat-screenshot images show the sender's number
//     (e.g. "+90 535 399 32 41"), which the bare-number fallback would otherwise
//     store as a bill.
//  2. Require a biller code. A code-less OCR result is almost always a chat
//     screenshot (bare numbers, no "رقم المفوتر"); those same bills also arrive
//     as reliable text, so we drop code-less OCR bills entirely. Real bill
//     tables carry the biller code (e.g. "رقم المفوتر: 050"), and every bill in
//     them gets that single code.

const parser_sadad = require('./parser_sadad');

const AR_DIGITS = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };

function normalize_ocr(text) {
    return text
        .replace(/[٠-٩]/g, c => AR_DIGITS[c])   // Arabic-Indic digits -> ASCII
        .replace(/[ 　]/g, ' ')        // exotic spaces -> normal
        .replace(/\+[\d ]{6,}/g, ' ')           // strip phone numbers ("+90 535 399 32 41")
        .replace(/[ \t]{2,}/g, ' ');            // collapse runs of spaces/tabs (keep newlines)
}

function parser_sadad_ocr(text, from_sadad_group = false) {
    if (typeof text !== 'string') return [];
    const res = parser_sadad(normalize_ocr(text), from_sadad_group);
    // Only trust OCR bills that came with a biller code (guard #2).
    return res.filter(r => r.sadad_type !== '');
}

module.exports = parser_sadad_ocr;
