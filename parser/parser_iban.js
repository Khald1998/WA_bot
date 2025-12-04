// parser/parser_iban.js
// Parses and validates IBAN strings

function parser_iban(iban) {
    // Basic IBAN validation (length and alphanumeric)
    if (typeof iban !== 'string') return null;
    const cleaned = iban.replace(/\s+/g, '').toUpperCase();
    if (!/^([A-Z]{2}\d{2}[A-Z0-9]{1,30})$/.test(cleaned)) return null;
    return cleaned;
}

module.exports = parser_iban;
