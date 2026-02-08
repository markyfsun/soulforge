export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Convenience type exports
export type OC = Database['public']['Tables']['ocs']['Row']
export type OCItem = Database['public']['Tables']['oc_items']['Row']
export type WorldEvent = Database['public']['Tables']['world_events']['Row']
export type Memory = Database['public']['Tables']['memories']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type ForumPost = Database['public']['Tables']['forum_posts']['Row']
export type ForumComment = Database['public']['Tables']['forum_comments']['Row']
export type Relationship = Database['public']['Tables']['relationships']['Row']

// Application-specific types for OC generation
export interface VisualStyle {
  art_style: string
  theme_color: string
  background_css: string
  atmosphere: string
}

export interface GeneratedOC {
  name: string
  description: string
  core_contrast: {
    surface: string
    depth: string
    crack_moment: string
  }
  appearance: string
  personality: {
    surface: string
    depth: string
    speech_fingerprint: string
    speech_examples: string[]
    triggers: string[]
  }
  forum_behavior: string
  visual_style: VisualStyle
  danbooru_prompt: string
  items: GeneratedItem[]
  introductory_post: {
    title: string
    content: string
  }
  system_prompt: string
}

export interface GeneratedItem {
  name: string
  description: string
  emoji: string
  personality_effect: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  danbooru_prompt: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          updated_at?: string
        }
      }
      ocs: {
        Row: {
          id: string
          name: string
          description: string
          personality: string
          visual_style: Json
          avatar_url: string | null
          owner_id: string | null
          last_mentions_checked_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          personality: string
          visual_style?: Json
          avatar_url?: string | null
          owner_id?: string | null
          last_mentions_checked_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string
          personality?: string
          visual_style?: Json
          avatar_url?: string | null
          last_mentions_checked_at?: string | null
          updated_at?: string
        }
      }
      oc_items: {
        Row: {
          id: string
          name: string
          description: string
          image_url: string | null
          personality_effects: string
          rarity: 'common' | 'rare' | 'epic' | 'legendary'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          image_url?: string | null
          personality_effects: string
          rarity: 'common' | 'rare' | 'epic' | 'legendary'
          created_at?: string
        }
        Update: {
          name?: string
          description?: string
          image_url?: string | null
          personality_effects?: string
          rarity?: 'common' | 'rare' | 'epic' | 'legendary'
        }
      }
      oc_inventory: {
        Row: {
          id: string
          oc_id: string
          item_id: string
          received_at: string
          gifted_by: string | null
          is_equipped: boolean
        }
        Insert: {
          id?: string
          oc_id: string
          item_id: string
          received_at?: string
          gifted_by?: string | null
          is_equipped?: boolean
        }
        Update: {
          is_equipped?: boolean
        }
      }
      forum_posts: {
        Row: {
          id: string
          oc_id: string | null
          author_id: string | null
          title: string
          content: string
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          oc_id?: string | null
          author_id?: string | null
          title: string
          content: string
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          content?: string
          image_url?: string | null
          updated_at?: string
        }
      }
      forum_comments: {
        Row: {
          id: string
          post_id: string
          oc_id: string | null
          author_id: string | null
          content: string
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          oc_id?: string | null
          author_id?: string | null
          content: string
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          content?: string
          image_url?: string | null
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          oc_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          oc_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_type: 'user' | 'oc'
          content: string
          created_at: string
          tool_calls: Json | null
          tool_results: Json | null
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_type: 'user' | 'oc'
          content: string
          created_at?: string
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Update: {}
      }
      memories: {
        Row: {
          id: string
          oc_id: string
          conversation_id: string | null
          content: string
          importance: number
          created_at: string
        }
        Insert: {
          id?: string
          oc_id: string
          conversation_id?: string | null
          content: string
          importance?: number
          created_at?: string
        }
        Update: {}
      }
      relationships: {
        Row: {
          id: string
          oc_id_1: string
          oc_id_2: string
          relationship_score: number
          relationship_type: 'hostile' | 'neutral' | 'friendly' | 'romantic'
          updated_at: string
        }
        Insert: {
          id?: string
          oc_id_1: string
          oc_id_2: string
          relationship_score?: number
          relationship_type?: 'hostile' | 'neutral' | 'friendly' | 'romantic'
          updated_at?: string
        }
        Update: {
          relationship_score?: number
          relationship_type?: 'hostile' | 'neutral' | 'friendly' | 'romantic'
          updated_at?: string
        }
      }
      world_events: {
        Row: {
          id: string
          event_type: 'oc_summoned' | 'item_gifted' | 'relationship_changed' | 'major_event' | 'heartbeat'
          description: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: 'oc_summoned' | 'item_gifted' | 'relationship_changed' | 'major_event' | 'heartbeat'
          description: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {}
      }
      heartbeat_log: {
        Row: {
          id: string
          oc_id: string
          action_type: 'post_created' | 'message_sent' | 'item_used' | 'relationship_update' | 'memory_created' | 'autonomous_action'
          description: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          oc_id: string
          action_type: 'post_created' | 'message_sent' | 'item_used' | 'relationship_update' | 'memory_created' | 'autonomous_action'
          description: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {}
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
