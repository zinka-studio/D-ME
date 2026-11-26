PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS automations (
  id TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  media_id TEXT NOT NULL DEFAULT '*',
  keywords_json TEXT NOT NULL,
  match_mode TEXT NOT NULL DEFAULT 'exact' CHECK (match_mode IN ('exact', 'contains')),
  target_url TEXT NOT NULL,
  message_template TEXT NOT NULL,
  follow_gate INTEGER NOT NULL DEFAULT 1 CHECK (follow_gate IN (0, 1)),
  follow_prompt TEXT NOT NULL,
  follow_button TEXT NOT NULL DEFAULT 'עקבתי - בדיקה',
  follow_check_fail_open INTEGER NOT NULL DEFAULT 1 CHECK (follow_check_fail_open IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_automations_enabled_media
  ON automations (enabled, media_id);

CREATE TABLE IF NOT EXISTS processed_comments (
  comment_id TEXT PRIMARY KEY,
  automation_id TEXT NOT NULL,
  instagram_user_id TEXT NOT NULL,
  media_id TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('processing', 'pending_follow', 'link_sent', 'failed')),
  profile_follow_status INTEGER CHECK (profile_follow_status IN (0, 1) OR profile_follow_status IS NULL),
  message_id TEXT,
  error_code TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (automation_id) REFERENCES automations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_processed_comments_status
  ON processed_comments (status, updated_at);

CREATE TABLE IF NOT EXISTS follow_sessions (
  instagram_user_id TEXT PRIMARY KEY,
  comment_id TEXT NOT NULL,
  automation_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comment_id) REFERENCES processed_comments(comment_id) ON DELETE CASCADE,
  FOREIGN KEY (automation_id) REFERENCES automations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_follow_sessions_expiry
  ON follow_sessions (expires_at);
