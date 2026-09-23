const parser_sadad = require('./parser_sadad');  // reuse the text SADAD parser — module: SADAD extraction tuned for OCR (image) text. Wired into the pipeline in services/PFG_bussiness_logic.js (fed ocr_image text). SADAD bill numbers have NO check digit, so an OCR misread can't be detected or repaired — this parser never guesses digits. Two guards keep OCR output clean: 1. Strip phone numbers. Chat-screenshot images show the sender's number (e.g. "+90 535 399 32 41"), which the bare-number fallback would otherwise store as a bill. 2. Require a biller code. A code-less OCR result is almost always a chat screenshot (bare numbers, no "رقم المفوتر"); those same bills also arrive as reliable text, so we drop code-less OCR bills entirely. Real bill tables carry the biller code (e.g. "رقم المفوتر: 050"), and every bill in them gets that single code.

function parser_sadad_ocr(text, from_sadad_group = false) {  // parse SADAD bills from OCR text
    if (typeof text !== 'string') return [];  // ignore non-string input
    const norm = text.replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x0660)).replace(/[ 　]/g, ' ').replace(/\+[\d ]{6,}/g, ' ').replace(/[ \t]{2,}/g, ' ');  // normalize OCR: Arabic-Indic digits -> ASCII, exotic spaces (NBSP/ideographic) -> normal, strip phone numbers ("+90 535 399 32 41"), collapse space/tab runs (keep newlines)
    return parser_sadad(norm, from_sadad_group, false).filter(r => r.sadad_type !== '');  // parse with allow_placeholder=false (no '000' from noisy image text), then keep only bills that carried a biller code (guard #2)
}  // end parser_sadad_ocr

module.exports = parser_sadad_ocr;  // export the OCR parser
