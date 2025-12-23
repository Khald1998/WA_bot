// db/schema/PII.js
// Defines the SQLite schema for storing Personally Identifiable Information (PII)

const phone = `
CREATE TABLE IF NOT EXISTS phone (
    id TEXT PRIMARY KEY NOT NULL,
    FPG_logs_id TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    original_text TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_reported INTEGER DEFAULT 0
);
`;

module.exports = phone;
