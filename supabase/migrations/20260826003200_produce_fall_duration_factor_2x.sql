-- Produce-mode fall duration: 1.5x → 2x relative to MCQ base.

UPDATE game_tuning
SET value = 2
WHERE key = 'produce_fall_duration_factor';

INSERT INTO game_tuning (key, value)
VALUES ('produce_fall_duration_factor', 2)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
