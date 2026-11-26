ALTER TABLE automations ADD COLUMN trigger_source TEXT NOT NULL DEFAULT 'comment'
  CHECK (trigger_source IN ('comment', 'story_reply'));

CREATE INDEX IF NOT EXISTS idx_automations_trigger_source
  ON automations (enabled, trigger_source, media_id);
