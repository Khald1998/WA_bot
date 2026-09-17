// db/schema/phone.js
// Defines the SQLite schema for storing captured phone numbers

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
`;  // end of the CREATE TABLE template literal for the phone table

module.exports = phone;  // export the phone-table DDL string
