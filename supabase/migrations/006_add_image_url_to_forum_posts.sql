-- Add image_url column to forum_posts
ALTER TABLE forum_posts ADD COLUMN image_url TEXT;

-- Add image_url column to forum_comments
ALTER TABLE forum_comments ADD COLUMN image_url TEXT;
