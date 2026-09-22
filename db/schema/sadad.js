const sadad = `
CREATE TABLE IF NOT EXISTS sadad (
    id TEXT PRIMARY KEY NOT NULL,
    FPG_logs_id TEXT NOT NULL,
    sadad_number TEXT NOT NULL,
    sadad_type TEXT NOT NULL,
    original_text TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_reported INTEGER DEFAULT 0
);
`;                                                                 // end the SADAD table schema SQL string; defines the sqlite schema for storing sadad bill payment information

module.exports = sadad;                                            // export the SADAD schema SQL
