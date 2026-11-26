ALTER TABLE automations ADD COLUMN media_selection_mode TEXT NOT NULL DEFAULT 'selected'
  CHECK (media_selection_mode IN ('all', 'selected', 'next_waiting', 'next_bound'));

ALTER TABLE automations ADD COLUMN next_post_started_at TEXT;

UPDATE automations
SET media_selection_mode = CASE WHEN media_id = '*' THEN 'all' ELSE 'selected' END;

CREATE INDEX IF NOT EXISTS idx_automations_next_post
  ON automations (enabled, media_selection_mode, created_at);
