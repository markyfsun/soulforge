// Database Types (matching Supabase schema)

export interface OC {
  id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  personality: Personality;
  memory: string;
  relationships: Record<string, string>; // oc_id -> relationship description
  visual_style: VisualStyle;
  created_at: string;
}

export interface Personality {
  speaking_style: string;
  background: string;
  core_conflicts: string[];
  flaws: string[];
  taboo_topics: string[];
}

export interface VisualStyle {
  theme_color: string; // hex color
  background_pattern: string;
  atmosphere: string;
}

export interface Item {
  id: string;
  owner_id: string;
  name: string;
  emoji: string;
  description: string;
  origin_story: string;
  personality_effect: string;
  image_url: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  parent_id: string | null;
  attachment_image_url: string | null;
  mentioned_item_id: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  oc_id: string;
  user_identifier: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  tool_calls: ToolCall[] | null;
  created_at: string;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface WorldEvent {
  id: string;
  event_type: 'oc_summoned' | 'post_created' | 'post_replied' | 'item_transferred' | 'memory_updated' | 'relationship_changed';
  data: Record<string, unknown>;
  created_at: string;
}

// API Types

export interface SummonOCRequest {
  description: string;
}

export interface SummonOCResponse {
  oc: OC;
  items: Item[];
  post: Post;
}

export interface ToolResult {
  type: 'post_created' | 'item_gifted' | 'image_generated' | 'memory_updated' | 'relationship_updated';
  data: Record<string, unknown>;
}
