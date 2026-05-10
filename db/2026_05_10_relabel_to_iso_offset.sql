-- One-time relabel: convert fake-UTC timestamps (KSA wall-clock with 'Z' suffix
-- or naked SQLite format) to honest ISO 8601 with '+03:00' offset.
--
-- Background: at b20197d every existing row was bulk-shifted +3h and new writes
-- started using KSA wall-clock with a 'Z' suffix. This script keeps the digits
-- and just replaces the (wrong) UTC label with the correct +03:00 offset.
--
-- Idempotent: WHERE clauses skip already-migrated rows. Safe to re-run.

BEGIN;

-- IBAN
UPDATE IBAN SET created_at = REPLACE(created_at, 'Z', '+03:00')
  WHERE created_at LIKE '%Z';
UPDATE IBAN SET updated_at = REPLACE(updated_at, 'Z', '+03:00')
  WHERE updated_at LIKE '%Z';
UPDATE IBAN SET updated_at = REPLACE(updated_at, ' ', 'T') || '.000+03:00'
  WHERE updated_at LIKE '____-__-__ __:__:__';

-- national_id
UPDATE national_id SET created_at = REPLACE(created_at, 'Z', '+03:00')
  WHERE created_at LIKE '%Z';
UPDATE national_id SET updated_at = REPLACE(updated_at, 'Z', '+03:00')
  WHERE updated_at LIKE '%Z';
UPDATE national_id SET updated_at = REPLACE(updated_at, ' ', 'T') || '.000+03:00'
  WHERE updated_at LIKE '____-__-__ __:__:__';

-- sadad
UPDATE sadad SET created_at = REPLACE(created_at, 'Z', '+03:00')
  WHERE created_at LIKE '%Z';
UPDATE sadad SET updated_at = REPLACE(updated_at, 'Z', '+03:00')
  WHERE updated_at LIKE '%Z';
UPDATE sadad SET updated_at = REPLACE(updated_at, ' ', 'T') || '.000+03:00'
  WHERE updated_at LIKE '____-__-__ __:__:__';

-- phone
UPDATE phone SET created_at = REPLACE(created_at, 'Z', '+03:00')
  WHERE created_at LIKE '%Z';
UPDATE phone SET updated_at = REPLACE(updated_at, 'Z', '+03:00')
  WHERE updated_at LIKE '%Z';
UPDATE phone SET updated_at = REPLACE(updated_at, ' ', 'T') || '.000+03:00'
  WHERE updated_at LIKE '____-__-__ __:__:__';

COMMIT;
