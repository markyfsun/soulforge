import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/generate-image/route'

// Mock KusaPics client
vi.mock('@/lib/kusapics', () => ({
  generateImage: vi.fn(),
  generateOCPrompt: vi.fn(),
  generateItemPrompt: vi.fn(),
}))

describe('Image Generation API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/generate-image', () => {
    it('should return 400 if type is missing', async () => {
      const request = new Request('http://localhost:3000/api/generate-image', {
        method: 'POST',
        body: JSON.stringify({ data: {} }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Type and data are required')
    })

    it('should return 400 if data is missing', async () => {
      const request = new Request('http://localhost:3000/api/generate-image', {
        method: 'POST',
        body: JSON.stringify({ type: 'oc' }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should return 400 for invalid type', async () => {
      const request = new Request('http://localhost:3000/api/generate-image', {
        method: 'POST',
        body: JSON.stringify({ type: 'invalid', data: {} }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid type')
    })

    it('should return 400 for custom type without prompt', async () => {
      const request = new Request('http://localhost:3000/api/generate-image', {
        method: 'POST',
        body: JSON.stringify({ type: 'custom', data: {} }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Prompt is required for custom type')
    })

    it('should generate image for OC type', async () => {
      const { generateImage, generateOCPrompt } = await import('@/lib/kusapics')
      vi.mocked(generateOCPrompt).mockReturnValue('test oc prompt')
      vi.mocked(generateImage).mockResolvedValue('https://example.com/image.png')

      const request = new Request('http://localhost:3000/api/generate-image', {
        method: 'POST',
        body: JSON.stringify({
          type: 'oc',
          data: {
            name: 'Luna',
            description: 'A mysterious girl',
            visual_style: {
              background: 'starry',
              primaryColor: 'purple',
              accentColor: 'silver',
              mood: 'peaceful',
              atmosphere: 'ethereal',
            },
          },
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.imageUrl).toBe('https://example.com/image.png')
      expect(generateOCPrompt).toHaveBeenCalled()
      expect(generateImage).toHaveBeenCalledWith(
        { prompt: 'test oc prompt', style_id: '1', width: 960, height: 1680, amount: 1 },
        { maxAttempts: 30, pollIntervalMs: 2000 }
      )
    })

    it('should generate image for item type', async () => {
      const { generateImage, generateItemPrompt } = await import('@/lib/kusapics')
      vi.mocked(generateItemPrompt).mockReturnValue('test item prompt')
      vi.mocked(generateImage).mockResolvedValue('https://example.com/item.png')

      const request = new Request('http://localhost:3000/api/generate-image', {
        method: 'POST',
        body: JSON.stringify({
          type: 'item',
          data: {
            name: 'Magic Sword',
            description: 'A powerful blade',
            rarity: 'legendary',
          },
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.imageUrl).toBe('https://example.com/item.png')
      expect(generateItemPrompt).toHaveBeenCalled()
    })

    it('should generate image for custom type with prompt', async () => {
      const { generateImage } = await import('@/lib/kusapics')
      vi.mocked(generateImage).mockResolvedValue('https://example.com/custom.png')

      const request = new Request('http://localhost:3000/api/generate-image', {
        method: 'POST',
        body: JSON.stringify({
          type: 'custom',
          data: { prompt: 'a beautiful sunset' },
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.imageUrl).toBe('https://example.com/custom.png')
      expect(generateImage).toHaveBeenCalledWith(
        { prompt: 'a beautiful sunset', style_id: '1', width: 960, height: 1680, amount: 1 },
        { maxAttempts: 30, pollIntervalMs: 2000 }
      )
    })

    it('should handle generation errors', async () => {
      const { generateImage, generateOCPrompt } = await import('@/lib/kusapics')
      vi.mocked(generateOCPrompt).mockReturnValue('test prompt')
      vi.mocked(generateImage).mockRejectedValue(new Error('API error'))

      const request = new Request('http://localhost:3000/api/generate-image', {
        method: 'POST',
        body: JSON.stringify({
          type: 'oc',
          data: {
            name: 'Test',
            description: 'Test',
          },
        }),
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('API error')
    })
  })
})
