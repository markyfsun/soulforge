-- Fix conversations RLS to allow unauthenticated users
-- This is needed because the app doesn't require user login

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;

-- Create new policies that allow unauthenticated access
-- Since this app doesn't require login, we allow all operations on conversations
CREATE POLICY "Anyone can view conversations"
  ON conversations FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update conversations"
  ON conversations FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete conversations"
  ON conversations FOR DELETE
  USING (true);

-- Similar fixes for messages table
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in conversations" ON messages;

CREATE POLICY "Anyone can view messages"
  ON messages FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert messages"
  ON messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update messages"
  ON messages FOR UPDATE
  USING (true);
