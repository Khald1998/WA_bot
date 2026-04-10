const ibantools = require('ibantools');



function validate_ibans(ibans) {
    // Accepts an array of IBAN candidates, returns only valid ones (normalized)
    const valid_ibans = [];
    for (const candidate of ibans) {
        const normalized_iban = candidate.toUpperCase().replace(/\s/g, '');
        if (ibantools.isValidIBAN(normalized_iban)) {
            valid_ibans.push(normalized_iban);
        }
    }
    return valid_ibans;
}

function parser_iban(text) {
    if (typeof text !== 'string') {
        return [];
    }

    // Step 1: Remove acceptable formatting characters (all whitespace types and dashes)
    let cleaned_text = text
        .trim()                    // Remove leading/trailing whitespace
        .replace(/-/g, '')         // Remove dashes
        .replace(/\*/g, '')        // Remove asterisks
        .replace(/ /g, '')         // Remove spaces
        .replace(/\t/g, '')        // Remove tabs
        .replace(/\n/g, '')        // Remove newlines
        .replace(/\r/g, '')        // Remove carriage returns
        .replace(/\u00A0/g, '')    // Remove non-breaking spaces
        .replace(/\u3000/g, '')    // Remove ideographic spaces
        .toUpperCase();
    
    // Step 2: Find IBAN patterns (2 letters + 2 digits + 1-30 alphanumerics)
    const iban_regex = /[A-Z]{2}\d{2}[A-Z0-9]{1,30}/g;
    let potential_matches = cleaned_text.match(iban_regex) || [];
    
    // Step 3: If no matches found and text contains only valid IBAN chars starting with digits,
    // try prefixing with 'SA' (Saudi Arabia)
    if (potential_matches.length === 0) {
        // Extract only alphanumeric characters for the fallback check
        const alphanumeric_only = cleaned_text.replace(/[^A-Z0-9]/g, '');
        
        // If it starts with digits (no country code), prefix with 'SA'
        if (/^\d/.test(alphanumeric_only) && alphanumeric_only.length > 0) {
            const with_prefix = 'SA' + alphanumeric_only;
            potential_matches = with_prefix.match(iban_regex) || [];
        }
    }
    
    // Step 4: Filter out matches that contain invalid characters (like #)
    // This check is now per-match, not for the whole text
    potential_matches = potential_matches.filter(iban => {
        return /^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban);
    });
    
    // Step 5: Validate the candidates
    return validate_ibans(potential_matches);
}

module.exports = parser_iban;