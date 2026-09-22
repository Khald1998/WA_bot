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
`;  // defines the sqlite schema for storing iban (international bank account number) information; end IBAN CREATE TABLE statement text

module.exports = IBAN;  // export the schema string
