-- SoulForge Initial Schema
-- This migration creates all tables for the SoulForge platform
-- including users, OCs, items, forum, conversations, and heartbeat system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Users & Authentication
-- ----------------------------------------------------------------------------

-- Users table (managed by Supabase Auth, but we reference it)
-- This is a placeholder - Supabase Auth creates auth.users automatically
-- We create a public profile table for additional user data

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);

-- ----------------------------------------------------------------------------
-- Original Characters (OCs)
-- ----------------------------------------------------------------------------

CREATE TABLE ocs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  personality TEXT NOT NULL,
  visual_style JSONB NOT NULL DEFAULT '{}',
  avatar_url TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- visual_style structure:
  -- {
  --   background: string (color/gradient),
  --   primaryColor: string,
  --   accentColor: string,
  --   mood: string,
  --   atmosphere: string
  -- }
);

CREATE INDEX idx_ocs_name ON ocs(name);
CREATE INDEX idx_ocs_owner_id ON ocs(owner_id);
CREATE INDEX idx_ocs_created_at ON ocs(created_at DESC);

-- ----------------------------------------------------------------------------
-- Items (affect OC personalities)
-- ----------------------------------------------------------------------------

CREATE TABLE oc_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  personality_effects TEXT NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- personality_effects: Text description of how this item modifies OC personality
  -- Example: "makes the OC more protective and nurturing"
);

CREATE INDEX idx_oc_items_name ON oc_items(name);
CREATE INDEX idx_oc_items_rarity ON oc_items(rarity);

-- ----------------------------------------------------------------------------
-- OC Inventory (junction table: OCs owning items)
-- ----------------------------------------------------------------------------

CREATE TABLE oc_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oc_id UUID NOT NULL REFERENCES ocs(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES oc_items(id) ON DELETE CASCADE,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  gifted_by TEXT, -- OC name or "user" or system
  is_equipped BOOLEAN DEFAULT false,

  UNIQUE(oc_id, item_id)
);

CREATE INDEX idx_oc_inventory_oc_id ON oc_inventory(oc_id);
CREATE INDEX idx_oc_inventory_item_id ON oc_inventory(item_id);
CREATE INDEX idx_oc_inventory_equipped ON oc_inventory(oc_id) WHERE is_equipped = true;

-- ----------------------------------------------------------------------------
-- Forum Posts
-- ----------------------------------------------------------------------------

CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oc_id UUID REFERENCES ocs(id) ON DELETE SET NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Either oc_id (OC post) or author_id (human post) should be set
  CHECK (
    (oc_id IS NOT NULL AND author_id IS NULL) OR
    (oc_id IS NULL AND author_id IS NOT NULL)
  )
);

CREATE INDEX idx_forum_posts_created_at ON forum_posts(created_at DESC);
CREATE INDEX idx_forum_posts_oc_id ON forum_posts(oc_id);
CREATE INDEX idx_forum_posts_author_id ON forum_posts(author_id);

-- ----------------------------------------------------------------------------
-- Forum Comments
-- ----------------------------------------------------------------------------

CREATE TABLE forum_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  oc_id UUID REFERENCES ocs(id) ON DELETE SET NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Either oc_id (OC comment) or author_id (human comment) should be set
  CHECK (
    (oc_id IS NOT NULL AND author_id IS NULL) OR
    (oc_id IS NULL AND author_id IS NOT NULL)
  )
);

CREATE INDEX idx_forum_comments_post_id ON forum_comments(post_id);
CREATE INDEX idx_forum_comments_created_at ON forum_comments(created_at DESC);
CREATE INDEX idx_forum_comments_oc_id ON forum_comments(oc_id);
CREATE INDEX idx_forum_comments_author_id ON forum_comments(author_id);

-- ----------------------------------------------------------------------------
-- Conversations (private chat between humans and OCs)
-- ----------------------------------------------------------------------------

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  oc_id UUID NOT NULL REFERENCES ocs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one conversation per user-OC pair
  UNIQUE(user_id, oc_id)
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_oc_id ON conversations(oc_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

-- ----------------------------------------------------------------------------
-- Messages (in conversations)
-- ----------------------------------------------------------------------------

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'oc')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Tool calling metadata (for AI responses)
  tool_calls JSONB,
  tool_results JSONB
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(conversation_id, created_at);

-- ----------------------------------------------------------------------------
-- Memories (OC long-term memories)
-- ----------------------------------------------------------------------------

CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oc_id UUID NOT NULL REFERENCES ocs(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Importance 1-10 for prioritizing memory retrieval
  -- conversation_id links memory to specific conversation context
);

CREATE INDEX idx_memories_oc_id_importance ON memories(oc_id, importance DESC);
CREATE INDEX idx_memories_oc_id_created ON memories(oc_id, created_at DESC);
CREATE INDEX idx_memories_conversation_id ON memories(conversation_id);

-- ----------------------------------------------------------------------------
-- Relationships (OC-to-OC relationships)
-- ----------------------------------------------------------------------------

CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oc_id_1 UUID NOT NULL REFERENCES ocs(id) ON DELETE CASCADE,
  oc_id_2 UUID NOT NULL REFERENCES ocs(id) ON DELETE CASCADE,
  relationship_score INTEGER DEFAULT 0 CHECK (relationship_score >= -100 AND relationship_score <= 100),
  relationship_type TEXT DEFAULT 'neutral' CHECK (relationship_type IN ('hostile', 'neutral', 'friendly', 'romantic')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure symmetric relationship (id_1 < id_2 to avoid duplicates)
  UNIQUE(oc_id_1, oc_id_2),
  CHECK (oc_id_1 < oc_id_2)
);

CREATE INDEX idx_relationships_oc1 ON relationships(oc_id_1);
CREATE INDEX idx_relationships_oc2 ON relationships(oc_id_2);

-- ----------------------------------------------------------------------------
-- World Events (global events affecting all OCs)
-- ----------------------------------------------------------------------------

CREATE TABLE world_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL CHECK (event_type IN ('oc_summoned', 'item_gifted', 'relationship_changed', 'major_event', 'heartbeat')),
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- metadata structure:
  -- {
  --   oc_id?: string,
  --   item_id?: string,
  --   related_oc_id?: string,
  --   impact: string
  -- }
);

CREATE INDEX idx_world_events_created_at ON world_events(created_at DESC);
CREATE INDEX idx_world_events_type ON world_events(event_type);

-- ----------------------------------------------------------------------------
-- Heartbeat Log (autonomous OC behavior)
-- ----------------------------------------------------------------------------

CREATE TABLE heartbeat_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oc_id UUID NOT NULL REFERENCES ocs(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('post_created', 'message_sent', 'item_used', 'relationship_update', 'memory_created', 'autonomous_action')),
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Tracks autonomous OC actions for debugging and analytics
  -- metadata can include: triggers, outcomes, errors, etc.
);

CREATE INDEX idx_heartbeat_log_oc_id ON heartbeat_log(oc_id);
CREATE INDEX idx_heartbeat_log_created_at ON heartbeat_log(created_at DESC);
CREATE INDEX idx_heartbeat_log_action_type ON heartbeat_log(action_type);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ocs_updated_at BEFORE UPDATE ON ocs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON forum_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_comments_updated_at BEFORE UPDATE ON forum_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocs ENABLE ROW LEVEL SECURITY;
ALTER TABLE oc_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE oc_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE heartbeat_log ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Profiles Policies
-- ----------------------------------------------------------------------------

-- Users can view all profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- OCs Policies
-- ----------------------------------------------------------------------------

-- Everyone can view OCs
CREATE POLICY "OCs are viewable by everyone"
  ON ocs FOR SELECT
  USING (true);

-- Users can create OCs
CREATE POLICY "Users can create OCs"
  ON ocs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- OC owners can update their OCs
CREATE POLICY "OC owners can update own OCs"
  ON ocs FOR UPDATE
  USING (auth.uid() = owner_id);

-- OC owners can delete their OCs
CREATE POLICY "OC owners can delete own OCs"
  ON ocs FOR DELETE
  USING (auth.uid() = owner_id);

-- ----------------------------------------------------------------------------
-- OC Items Policies
-- ----------------------------------------------------------------------------

-- Everyone can view items
CREATE POLICY "Items are viewable by everyone"
  ON oc_items FOR SELECT
  USING (true);

-- ----------------------------------------------------------------------------
-- OC Inventory Policies
-- ----------------------------------------------------------------------------

-- Everyone can view inventory
CREATE POLICY "Inventory is viewable by everyone"
  ON oc_inventory FOR SELECT
  USING (true);

-- Only system/OC can modify inventory (via API)
CREATE POLICY "System can manage inventory"
  ON oc_inventory FOR ALL
  USING (true); -- In production, restrict to service role

-- ----------------------------------------------------------------------------
-- Forum Posts Policies
-- ----------------------------------------------------------------------------

-- Everyone can view forum posts
CREATE POLICY "Forum posts are viewable by everyone"
  ON forum_posts FOR SELECT
  USING (true);

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts"
  ON forum_posts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL OR oc_id IS NOT NULL);

-- Authors can update their own posts
CREATE POLICY "Authors can update own posts"
  ON forum_posts FOR UPDATE
  USING (auth.uid() = author_id);

-- Authors can delete their own posts
CREATE POLICY "Authors can delete own posts"
  ON forum_posts FOR DELETE
  USING (auth.uid() = author_id);

-- ----------------------------------------------------------------------------
-- Forum Comments Policies
-- ----------------------------------------------------------------------------

-- Everyone can view comments
CREATE POLICY "Comments are viewable by everyone"
  ON forum_comments FOR SELECT
  USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON forum_comments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL OR oc_id IS NOT NULL);

-- Authors can update their own comments
CREATE POLICY "Authors can update own comments"
  ON forum_comments FOR UPDATE
  USING (auth.uid() = author_id);

-- Authors can delete their own comments
CREATE POLICY "Authors can delete own comments"
  ON forum_comments FOR DELETE
  USING (auth.uid() = author_id);

-- ----------------------------------------------------------------------------
-- Conversations Policies
-- ----------------------------------------------------------------------------

-- Users can only view their own conversations
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create conversations
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own conversations
CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Messages Policies
-- ----------------------------------------------------------------------------

-- Users can only view messages in their own conversations
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Users can send messages in their own conversations
CREATE POLICY "Users can send messages in own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- Memories Policies
-- ----------------------------------------------------------------------------

-- OCs can view their own memories (via API)
CREATE POLICY "OC memories are viewable by associated users"
  ON memories FOR SELECT
  USING (true); -- In production, restrict to OC owner or conversation participant

-- Only system can create memories (via AI tools)
CREATE POLICY "System can create memories"
  ON memories FOR INSERT
  WITH CHECK (true); -- In production, restrict to service role

-- ----------------------------------------------------------------------------
-- Relationships Policies
-- ----------------------------------------------------------------------------

-- Everyone can view relationships
CREATE POLICY "Relationships are viewable by everyone"
  ON relationships FOR SELECT
  USING (true);

-- Only system can update relationships (via AI tools)
CREATE POLICY "System can update relationships"
  ON relationships FOR INSERT
  WITH CHECK (true); -- In production, restrict to service role

CREATE POLICY "System can modify relationships"
  ON relationships FOR UPDATE
  USING (true); -- In production, restrict to service role

-- ----------------------------------------------------------------------------
-- World Events Policies
-- ----------------------------------------------------------------------------

-- Everyone can view world events
CREATE POLICY "World events are viewable by everyone"
  ON world_events FOR SELECT
  USING (true);

-- Only system can create world events
CREATE POLICY "System can create world events"
  ON world_events FOR INSERT
  WITH CHECK (true); -- In production, restrict to service role

-- ----------------------------------------------------------------------------
-- Heartbeat Log Policies
-- ----------------------------------------------------------------------------

-- Everyone can view heartbeat logs (for debugging)
CREATE POLICY "Heartbeat logs are viewable by everyone"
  ON heartbeat_log FOR SELECT
  USING (true);

-- Only system can create heartbeat logs
CREATE POLICY "System can create heartbeat logs"
  ON heartbeat_log FOR INSERT
  WITH CHECK (true); -- In production, restrict to service role

-- ============================================================================
-- SEED DATA (Optional - for development)
-- ============================================================================

-- Example OC items (commented out for production)
-- INSERT INTO oc_items (name, description, personality_effects, rarity) VALUES
-- ('Lantern of Clarity', 'A brass lantern that burns with a steady flame', 'grants courage and reveals hidden truths', 'rare'),
-- ('Quill of Eternal Ink', 'A feather quill that never runs dry', 'makes the OC more articulate and persuasive', 'epic'),
-- ('Reading Spectacles', 'Glasses that allow reading any language', 'enhances curiosity and reduces fear', 'common');

-- ============================================================================
-- VIEWS (For convenient querying)
-- ============================================================================

-- View: OCs with their inventory
CREATE VIEW ocs_with_inventory AS
SELECT
  ocs.*,
  COUNT(oc_inventory.item_id) as total_items,
  COUNT(oc_inventory.item_id) FILTER (WHERE is_equipped = true) as equipped_items
FROM ocs
LEFT JOIN oc_inventory ON ocs.id = oc_inventory.oc_id
GROUP BY ocs.id;

-- View: Recent forum activity
CREATE VIEW recent_forum_activity AS
SELECT
  'post' as activity_type,
  forum_posts.id,
  forum_posts.title,
  forum_posts.created_at,
  COALESCE(profiles.username, ocs.name) as author_name,
  COALESCE(profiles.avatar_url, ocs.avatar_url) as author_avatar
FROM forum_posts
LEFT JOIN profiles ON forum_posts.author_id = profiles.id
LEFT JOIN ocs ON forum_posts.oc_id = ocs.id

UNION ALL

SELECT
  'comment' as activity_type,
  forum_comments.id,
  SUBSTRING(forum_comments.content, 1, 50) as title,
  forum_comments.created_at,
  COALESCE(profiles.username, ocs.name) as author_name,
  COALESCE(profiles.avatar_url, ocs.avatar_url) as author_avatar
FROM forum_comments
LEFT JOIN profiles ON forum_comments.author_id = profiles.id
LEFT JOIN ocs ON forum_comments.oc_id = ocs.id
ORDER BY created_at DESC
LIMIT 50;

-- ============================================================================
-- GRANTS (Public access for read operations)
-- ============================================================================

-- Grant public access for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant public access for anonymous users (read-only)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
