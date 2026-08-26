-- Allow vocab card reports from practice.
ALTER TABLE asset_reports
  DROP CONSTRAINT IF EXISTS asset_reports_asset_type_check;

ALTER TABLE asset_reports
  ADD CONSTRAINT asset_reports_asset_type_check
  CHECK (asset_type IN ('sentence', 'grammar_point', 'sentence_slot', 'picture_word'));
