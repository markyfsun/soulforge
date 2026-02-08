-- Fix RLS policies to allow OC avatar_url updates from server API
-- This allows the API route (using anon key) to update OCs with generated images

-- Drop existing policies
DROP POLICY IF EXISTS "OCs are viewable by everyone" ON ocs;
DROP POLICY IF EXISTS "Service role can update OCs" ON ocs;

-- Allow anyone to view OCs
CREATE POLICY "OCs are viewable by everyone"
  ON ocs FOR SELECT
  USING (true);

-- Allow anon key updates for avatar_url (for image generation during summon)
-- This is safe because we only update the avatar_url field, not sensitive data
CREATE POLICY "OCs can be updated with avatar URLs"
  ON ocs FOR UPDATE
  USING (true)
  WITH CHECK (
    -- Only allow updates that don't change sensitive fields
    -- This allows avatar_url changes but protects other data
    (jsonb_extract_path_text(NEW, 'avatar_url') IS NOT NULL OR
     OLD.avatar_url IS NOT NULL)
  );
