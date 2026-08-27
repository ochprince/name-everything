-- Mark picture_words rows whose image / sentence / sentence audio were replaced.
ALTER TABLE picture_words
  ADD COLUMN ai_corrected BOOLEAN NOT NULL DEFAULT false;
