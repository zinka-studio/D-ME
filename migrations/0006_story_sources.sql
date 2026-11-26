CREATE TABLE IF NOT EXISTS story_sources (
  story_id TEXT PRIMARY KEY,
  story_url TEXT,
  first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_story_sources_last_seen_at
  ON story_sources(last_seen_at DESC);
