// parser/parser_sadad.js
// Parses SADAD bill payment numbers from text.

function parser_sadad(text) {
    let sadad_type = [
        "88",
        "75",
        "92",
        "171",
        "144",
        "138",
        "001",
        "002",
        "003",
        "59",
        "111",
        "169",
        "134",
    ];
    
    // 1. Validate input
    if (typeof text !== 'string') {
        return [];
    }

    // 2. Check if text contains the word "سداد" (SADAD in Arabic)
    if (!text.includes('سداد')) {
        return [];
    }

    // 3. Extract all numbers from text
    const numberRegex = /\b\d+\b/g;
    const allNumbers = text.match(numberRegex) || [];

    // 4. Check if at least one sadad_type exists in the extracted numbers
    const hasSadadType = allNumbers.some(num => sadad_type.includes(num));
    
    if (!hasSadadType) {
        return [];
    }

    // 5. Return only numbers with more than 7 digits
    const sadadNumbers = allNumbers.filter(num => num.length > 7);

    return sadadNumbers;
}

module.exports = parser_sadad;
