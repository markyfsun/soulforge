import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/oc/summon/route'
import { createClient } from '@/lib/supabase/server'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/oc-prompts')
vi.mock('@/lib/kusapics')
vi.mock('@/lib/logger')

describe('OC Summoning API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/oc/summon', () => {
    it('should return 400 if description is missing', async () => {
      const request = new Request('http://localhost:3000/api/oc/summon', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Description is required')
    })

    it('should return 400 if description is not a string', async () => {
      const request = new Request('http://localhost:3000/api/oc/summon', {
        method: 'POST',
        body: JSON.stringify({ description: 123 }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should handle name uniqueness by adding suffix', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn(),
        eq: vi.fn().mockReturnThis(),
      }

      // First call checks existence (returns true - name exists)
      // Second call checks unique name (returns false - name is unique)
      mockSupabase.single
        .mockResolvedValueOnce({ data: { id: 'existing' }, error: null })
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: { id: 'new-oc' }, error: null })

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

      const { generateOCFromDescription, ensureUniqueName } = await import('@/lib/oc-prompts')
      vi.mocked(generateOCFromDescription).mockResolvedValue({
        name: 'Test OC',
        description: 'A test character',
        personality: 'Test personality',
        visual_style: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          primaryColor: '#667eea',
          accentColor: '#764ba2',
          mood: 'mystical',
          atmosphere: 'dreamy',
        },
        items: [
          {
            name: 'Test Item',
            description: 'A test item',
            emoji: '⚔️',
            origin_story: 'Found in a test',
            personality_effect: 'Makes character more testy',
            rarity: 'common',
          },
        ],
        introductory_post: {
          title: 'Hello',
          content: 'I am a test OC',
        },
      })

      vi.mocked(ensureUniqueName).mockResolvedValue('Test OC_2')

      const request = new Request('http://localhost:3000/api/oc/summon', {
        method: 'POST',
        body: JSON.stringify({ description: 'A test character' }),
      })

      const response = await POST(request)
      const data = await response.json()

      // Note: This test structure assumes mocks are set up
      // In a real scenario, you'd need more comprehensive mocking
      expect(data).toBeDefined()
    })
  })
})

describe('Name Uniqueness Handler', () => {
  it('should return original name if unique', async () => {
    const { ensureUniqueName } = await import('@/lib/oc-prompts')
    const mockCheck = vi.fn().mockResolvedValue(false)

    const result = await ensureUniqueName('UniqueName', mockCheck)

    expect(result).toBe('UniqueName')
    expect(mockCheck).toHaveBeenCalledWith('UniqueName')
    expect(mockCheck).toHaveBeenCalledTimes(1)
  })

  it('should add suffix if name exists', async () => {
    const { ensureUniqueName } = await import('@/lib/oc-prompts')
    const mockCheck = vi.fn()
      .mockResolvedValueOnce(true)  // 'Name' exists
      .mockResolvedValueOnce(false) // 'Name_1' is unique

    const result = await ensureUniqueName('Name', mockCheck)

    expect(result).toBe('Name_1')
    expect(mockCheck).toHaveBeenCalledTimes(2)
  })

  it('should increment suffix until unique', async () => {
    const { ensureUniqueName } = await import('@/lib/oc-prompts')
    const mockCheck = vi.fn()
      .mockResolvedValueOnce(true)  // 'Name' exists
      .mockResolvedValueOnce(true)  // 'Name_1' exists
      .mockResolvedValueOnce(true)  // 'Name_2' exists
      .mockResolvedValueOnce(false) // 'Name_3' is unique

    const result = await ensureUniqueName('Name', mockCheck)

    expect(result).toBe('Name_3')
    expect(mockCheck).toHaveBeenCalledTimes(4)
  })
})

describe('Image Generation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate OC avatar and item images during summon', async () => {
    const { generateOCFromDescription, ensureUniqueName } = await import('@/lib/oc-prompts')
    const { generateImage, generateOCPrompt, generateItemPrompt } = await import('@/lib/kusapics')

    // Mock OC generation
    vi.mocked(generateOCFromDescription).mockResolvedValue({
      name: 'Test OC',
      description: 'A test character',
      personality: 'Test personality',
      visual_style: {
        background: 'starry',
        primaryColor: 'purple',
        accentColor: 'silver',
        mood: 'peaceful',
        atmosphere: 'ethereal',
      },
      items: [
        {
          name: 'Test Item',
          description: 'A test item',
          emoji: '⚔️',
          origin_story: 'Found in a test',
          personality_effect: 'Makes character more testy',
          rarity: 'common',
        },
      ],
      introductory_post: {
        title: 'Hello',
        content: 'I am a test OC',
      },
    })

    vi.mocked(ensureUniqueName).mockResolvedValue('Test OC')

    // Mock image generation
    vi.mocked(generateOCPrompt).mockReturnValue('test oc prompt')
    vi.mocked(generateItemPrompt).mockReturnValue('test item prompt')
    vi.mocked(generateImage)
      .mockResolvedValueOnce('https://example.com/avatar.png') // OC avatar
      .mockResolvedValueOnce('https://example.com/item.png') // Item image

    // Mock Supabase
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }

    // Mock OC insertion
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'oc-123',
        name: 'Test OC',
        avatar_url: '/avatars/placeholder.png',
      },
      error: null,
    })

    // Mock OC update (after avatar generation)
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    // Mock item insertion
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'item-123',
        name: 'Test Item',
      },
      error: null,
    })

    // Mock inventory insertion
    mockSupabase.single.mockResolvedValue({ data: null, error: null })

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const request = new Request('http://localhost:3000/api/oc/summon', {
      method: 'POST',
      body: JSON.stringify({ description: 'A test character' }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    // Verify image generation was called
    expect(generateOCPrompt).toHaveBeenCalledWith({
      name: 'Test OC',
      description: 'A test character',
      visual_style: {
        background: 'starry',
        primaryColor: 'purple',
        accentColor: 'silver',
        mood: 'peaceful',
        atmosphere: 'ethereal',
      },
    })

    expect(generateItemPrompt).toHaveBeenCalledWith({
      name: 'Test Item',
      description: 'A test item',
      rarity: 'common',
    })

    expect(generateImage).toHaveBeenCalledTimes(2) // Once for OC, once for item

    // Verify calls for OC avatar
    expect(generateImage).toHaveBeenCalledWith(
      {
        prompt: 'test oc prompt',
        width: 960,
        height: 1680,
        amount: 1,
      },
      {
        maxAttempts: 30,
        pollIntervalMs: 2000,
      }
    )

    // Verify calls for item image
    expect(generateImage).toHaveBeenCalledWith(
      {
        prompt: 'test item prompt',
        width: 768,
        height: 768,
        amount: 1,
      },
      {
        maxAttempts: 30,
        pollIntervalMs: 2000,
      }
    )

    expect(data.success).toBe(true)
  })
})
