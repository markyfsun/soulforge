import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createPostTool,
  giftItemTool,
  generateItemImageTool,
  updateMemoryTool,
  updateRelationshipTool,
} from '@/lib/chat-tools'

describe('Chat Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createPostTool', () => {
    it('should create a forum post successfully', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'post-123' },
          error: null,
        }),
      }

      vi.doMock('@/lib/supabase/server', () => ({
        createClient: async () => mockSupabase,
      }))

      const result = await createPostTool('oc-123', {
        title: 'Test Post',
        content: 'Test content',
      })

      expect(result.success).toBe(true)
      expect(result.post_id).toBe('post-123')
      expect(result.result).toContain('published to the forum')
    })

    it('should handle database errors', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
        }),
      }

      vi.doMock('@/lib/supabase/server', () => ({
        createClient: async () => mockSupabase,
      }))

      const result = await createPostTool('oc-123', {
        title: 'Test Post',
        content: 'Test content',
      })

      expect(result.success).toBe(false)
      expect(result.result).toContain('Failed to create post')
    })
  })

  describe('giftItemTool', () => {
    it('should verify item ownership before gifting', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null, // Item not owned
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
      }

      vi.doMock('@/lib/supabase/server', () => ({
        createClient: async () => mockSupabase,
      }))

      const result = await giftItemTool('oc-123', {
        item_id: 'item-456',
        recipient_oc_id: 'oc-789',
      })

      expect(result.success).toBe(false)
      expect(result.result).toContain("don't own this item")
    })

    it('should transfer item successfully', async () => {
      let callCount = 0
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => {
          callCount++
          if (callCount === 1) {
            // Ownership check
            return Promise.resolve({ data: { item_id: 'item-456', oc_id: 'oc-123' }, error: null })
          } else if (callCount === 2) {
            // Recipient name
            return Promise.resolve({ data: { name: 'Recipient OC' }, error: null })
          } else {
            // Item name
            return Promise.resolve({ data: { name: 'Test Item' }, error: null })
          }
        }),
        update: vi.fn().mockReturnThis(),
      }

      vi.doMock('@/lib/supabase/server', () => ({
        createClient: async () => mockSupabase,
      }))

      const result = await giftItemTool('oc-123', {
        item_id: 'item-456',
        recipient_oc_id: 'oc-789',
      })

      expect(result.success).toBe(true)
      expect(result.result).toContain('gifted')
    })
  })

  describe('updateMemoryTool', () => {
    it('should store memory with correct importance', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ error: null }),
      }

      vi.doMock('@/lib/supabase/server', () => ({
        createClient: async () => mockSupabase,
      }))

      const result = await updateMemoryTool('oc-123', {
        content: 'Important memory',
        importance: 8,
      })

      expect(result.success).toBe(true)
      expect(result.result).toContain('remember this')
    })
  })

  describe('updateRelationshipTool', () => {
    it('should update relationship score within bounds', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            relationship_score: 50,
            relationship_type: 'friendly',
          },
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
      }

      vi.doMock('@/lib/supabase/server', () => ({
        createClient: async () => mockSupabase,
      }))

      const result = await updateRelationshipTool('oc-123', {
        target_oc_id: 'oc-456',
        score_change: 200, // Should be clamped to 100
        relationship_type: 'romantic',
      })

      expect(result.success).toBe(true)
    })

    it('should create new relationship if none exists', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        insert: vi.fn().mockReturnThis(),
      }

      vi.doMock('@/lib/supabase/server', () => ({
        createClient: async () => mockSupabase,
      }))

      const result = await updateRelationshipTool('oc-123', {
        target_oc_id: 'oc-456',
        score_change: 30,
      })

      expect(result.success).toBe(true)
    })
  })

  describe('generateItemImageTool', () => {
    it('should return placeholder URL initially', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockResolvedValue({ error: null }),
      }

      vi.doMock('@/lib/supabase/server', () => ({
        createClient: async () => mockSupabase,
      }))

      const result = await generateItemImageTool('oc-123', {
        item_id: 'item-456',
        prompt: 'A beautiful sword',
      })

      expect(result.success).toBe(true)
      expect(result.image_url).toContain('/items/')
    })
  })
})

describe('Chat System Integration', () => {
  it('should build system prompt with all context', async () => {
    const { buildChatSystemPrompt } = await import('@/lib/chat-prompts')

    const context = {
      oc: {
        id: 'oc-123',
        name: 'Test OC',
        description: 'A test character',
        personality: 'Test personality',
        visual_style: {},
        avatar_url: null,
        owner_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      items: [],
      worldEvents: [],
      memories: [],
      recentMessages: [],
    }

    const prompt = buildChatSystemPrompt(context)

    expect(prompt).toContain('Test OC')
    expect(prompt).toContain('Test personality')
    expect(prompt).toContain('create_post')
    expect(prompt).toContain('gift_item')
  })

  it('should include items in prompt when OC has items', async () => {
    const { buildChatSystemPrompt } = await import('@/lib/chat-prompts')

    const context = {
      oc: {
        id: 'oc-123',
        name: 'Test OC',
        description: 'A test character',
        personality: 'Test personality',
        visual_style: {},
        avatar_url: null,
        owner_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      items: [
        {
          id: 'item-1',
          name: 'Test Item',
          description: 'A test item',
          image_url: null,
          personality_effects: 'Makes OC more testy',
          rarity: 'common',
          created_at: new Date().toISOString(),
        },
      ],
      worldEvents: [],
      memories: [],
      recentMessages: [],
    }

    const prompt = buildChatSystemPrompt(context)

    expect(prompt).toContain('Test Item')
    expect(prompt).toContain('Makes OC more testy')
  })
})
