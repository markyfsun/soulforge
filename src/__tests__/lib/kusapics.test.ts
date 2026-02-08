import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateOCPrompt, generateItemPrompt } from '@/lib/kusapics'

describe('KusaPics Prompt Generation', () => {
  describe('generateOCPrompt', () => {
    it('should generate a basic prompt from OC name and description', () => {
      const oc = {
        name: 'Luna',
        description: 'A mysterious girl with silver hair',
      }

      const prompt = generateOCPrompt(oc)

      expect(prompt).toContain('1girl, solo')
      expect(prompt).toContain('character named Luna')
      expect(prompt).toContain('A mysterious girl with silver hair')
    })

    it('should include visual style in prompt when provided', () => {
      const oc = {
        name: 'Luna',
        description: 'A mysterious girl',
        visual_style: {
          background: 'starry night sky',
          primaryColor: 'purple',
          accentColor: 'silver',
          mood: 'peaceful',
          atmosphere: 'ethereal',
        },
      }

      const prompt = generateOCPrompt(oc)

      expect(prompt).toContain('peaceful expression')
      expect(prompt).toContain('ethereal atmosphere')
      expect(prompt).toContain('starry night sky background')
      expect(prompt).toContain('purple')
      expect(prompt).toContain('silver')
    })

    it('should handle OC without visual_style', () => {
      const oc = {
        name: 'Test',
        description: 'Test description',
      }

      const prompt = generateOCPrompt(oc)

      expect(prompt).toBeTruthy()
      expect(prompt).toContain('Test')
    })
  })

  describe('generateItemPrompt', () => {
    it('should generate a prompt for common item', () => {
      const item = {
        name: 'Wooden Sword',
        description: 'A basic wooden training sword',
        rarity: 'common',
      }

      const prompt = generateItemPrompt(item)

      expect(prompt).toContain('Wooden Sword')
      expect(prompt).toContain('A basic wooden training sword')
      expect(prompt).toContain('common quality')
      expect(prompt).toContain('detailed')
      expect(prompt).toContain('high quality')
      expect(prompt).toContain('centered on simple background')
    })

    it('should generate a prompt for legendary item', () => {
      const item = {
        name: 'Excalibur',
        description: 'The legendary sword of kings',
        rarity: 'legendary',
      }

      const prompt = generateItemPrompt(item)

      expect(prompt).toContain('Excalibur')
      expect(prompt).toContain('legendary quality')
    })
  })
})
