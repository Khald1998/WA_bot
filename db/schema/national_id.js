// db/schema/national_id.js
// Defines the SQLite schema for storing National ID information

const national_id = `
CREATE TABLE IF NOT EXISTS national_id (
    id TEXT PRIMARY KEY NOT NULL,
    FPG_logs_id TEXT NOT NULL,
    national_id_number TEXT NOT NULL,
    original_text TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_reported INTEGER DEFAULT 0
);
`;

module.exports = national_id;
