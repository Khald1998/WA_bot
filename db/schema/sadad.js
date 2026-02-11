// db/schema/sadad.js
// Defines the SQLite schema for storing SADAD bill payment information

const sadad = `
CREATE TABLE IF NOT EXISTS sadad (
    id TEXT PRIMARY KEY NOT NULL,
    FPG_logs_id TEXT NOT NULL,
    sadad_number TEXT NOT NULL,
    original_text TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_reported INTEGER DEFAULT 0
);
`;

module.exports = sadad;
