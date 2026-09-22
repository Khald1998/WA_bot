const parser_sadad = require('./parser_sadad');  // reuse the text SADAD parser — module: SADAD extraction tuned for OCR (image) text. Wired into the pipeline in services/PFG_bussiness_logic.js (fed ocr_image text). SADAD bill numbers have NO check digit, so an OCR misread can't be detected or repaired — this parser never guesses digits. Two guards keep OCR output clean: 1. Strip phone numbers. Chat-screenshot images show the sender's number (e.g. "+90 535 399 32 41"), which the bare-number fallback would otherwise store as a bill. 2. Require a biller code. A code-less OCR result is almost always a chat screenshot (bare numbers, no "رقم المفوتر"); those same bills also arrive as reliable text, so we drop code-less OCR bills entirely. Real bill tables carry the biller code (e.g. "رقم المفوتر: 050"), and every bill in them gets that single code.

const AR_DIGITS = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };  // map Arabic-Indic digits to ASCII digits

function normalize_ocr(text) {  // clean OCR text before parsing
    return text  // start the chained replacements
        .replace(/[٠-٩]/g, c => AR_DIGITS[c])   // Arabic-Indic digits -> ASCII
        .replace(/[ 　]/g, ' ')        // exotic spaces -> normal
        .replace(/\+[\d ]{6,}/g, ' ')           // strip phone numbers ("+90 535 399 32 41")
        .replace(/[ \t]{2,}/g, ' ');            // collapse runs of spaces/tabs (keep newlines)
}  // end normalize_ocr

function parser_sadad_ocr(text, from_sadad_group = false) {  // parse SADAD bills from OCR text
    if (typeof text !== 'string') return [];  // ignore non-string input
    const res = parser_sadad(normalize_ocr(text), from_sadad_group, false);  // parse normalized text, no placeholder codes — allow_placeholder=false: OCR bills are only trusted when they carry a real biller code, so no '000' placeholder is assigned from noisy image text.
    return res.filter(r => r.sadad_type !== '');  // keep only bills that carried a biller code — only trust OCR bills that came with a biller code (guard #2).
}  // end parser_sadad_ocr

module.exports = parser_sadad_ocr;  // export the OCR parser
