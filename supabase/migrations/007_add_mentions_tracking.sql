-- Add column to track when OC last processed their mentions
ALTER TABLE ocs ADD COLUMN last_mentions_checked_at TIMESTAMPTZ;

-- Create index on created_at for better query performance
CREATE INDEX IF NOT EXISTS forum_comments_created_at_idx ON forum_comments(created_at);
CREATE INDEX IF NOT EXISTS forum_posts_created_at_idx ON forum_posts(created_at);

-- Add comment
COMMENT ON COLUMN ocs.last_mentions_checked_at IS 'Last time this OC checked their @mentions. Used to show only new mentions in heartbeat.';
