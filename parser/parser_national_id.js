// parser/parser_national_id.js
// Parses and validates national ID (basic example)

function parser_national_id(nationalId) {
    if (typeof nationalId !== 'string') return null;
    // Remove spaces and dashes
    const cleaned = nationalId.replace(/[\s\-]/g, '');
    // Basic validation: must be alphanumeric, length 5-20
    if (!/^[A-Za-z0-9]{5,20}$/.test(cleaned)) return null;
    return cleaned;
}

module.exports = parser_national_id;
