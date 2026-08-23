-- ONE-TIME remote reset before applying the normalized baseline migrations.
-- Run in Supabase SQL Editor (or psql) when replacing the old sentence_slots schema.
-- After this, push migrations 20260823140000 + 20260823140001 (empty migration history).

BEGIN;

DROP TABLE IF EXISTS asset_reports CASCADE;
DROP TABLE IF EXISTS sentence_slot_refs CASCADE;
DROP TABLE IF EXISTS slots CASCADE;
DROP TABLE IF EXISTS sentence_slots CASCADE;
DROP TABLE IF EXISTS sentence_spans CASCADE;
DROP TABLE IF EXISTS sentences CASCADE;
DROP TABLE IF EXISTS levels CASCADE;
DROP TABLE IF EXISTS grammar_points CASCADE;
DROP TABLE IF EXISTS chapters CASCADE;
DROP TABLE IF EXISTS game_tuning CASCADE;

-- Clear CLI / GitHub migration history so the new baseline can apply cleanly.
DELETE FROM supabase_migrations.schema_migrations;

COMMIT;
