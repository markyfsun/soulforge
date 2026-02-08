-- Make user_id optional in conversations table
-- This allows unauthenticated users to have conversations with OCs

-- Drop foreign key constraint
ALTER TABLE conversations DROP CONSTRAINT conversations_user_id_fkey;

-- Make user_id nullable
ALTER TABLE conversations ALTER COLUMN user_id DROP NOT NULL;

-- Add back foreign key but without NOT NULL requirement
ALTER TABLE conversations
  ADD CONSTRAINT conversations_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Drop the unique constraint that includes user_id
ALTER TABLE conversations DROP CONSTRAINT conversations_user_id_oc_id_key;

-- Add new unique constraint that only requires oc_id
-- This allows multiple conversations for the same OC without requiring a user
ALTER TABLE conversations
  ADD CONSTRAINT conversations_oc_id_key
  UNIQUE (oc_id);
