// db/schema/IBAN.js
// Defines the SQLite schema for storing IBAN (International Bank Account Number) information

const IBAN = `
CREATE TABLE IF NOT EXISTS IBAN (
    id TEXT PRIMARY KEY NOT NULL,
    FPG_logs_id TEXT NOT NULL,
    iban_number TEXT NOT NULL,    
    original_text TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_reported INTEGER DEFAULT 0
);
`;

module.exports = IBAN;
