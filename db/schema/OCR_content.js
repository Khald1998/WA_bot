// db/schema/OCR_content.js
// Defines the SQLite schema for storing OCR content (only media_id and image_body)

const OCR_content = `
CREATE TABLE IF NOT EXISTS OCR_content (
    media_id TEXT PRIMARY KEY NOT NULL,
    image_body TEXT NOT NULL
);
`;

module.exports = OCR_content;
