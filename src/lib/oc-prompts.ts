import { GeneratedOC } from '@/types/database'
import { z } from 'zod'

// Zod schema for structured output
const GeneratedOCSchema = z.object({
  name: z.string().min(1).describe('Unique creative name (2-3 words)'),
  description: z.string().min(1).describe('2-3 sentence backstory'),
  personality: z.string().min(1).describe('Detailed personality (3-5 sentences: speaking style, background, conflicts, flaws, taboos)'),
  visual_style: z.object({
    background: z.string().describe('CSS gradient or color'),
    primaryColor: z.string().describe('Hex color code'),
    accentColor: z.string().describe('Hex color code'),
    mood: z.string().describe('Single adjective describing mood'),
    atmosphere: z.string().describe('Single adjective describing atmosphere'),
  }),
  items: z.array(z.object({
    name: z.string().describe('Item name'),
    description: z.string().describe('What it is and why it matters (1-2 sentences)'),
    emoji: z.string().describe('Single Unicode emoji representing this item'),
    origin_story: z.string().describe('Brief backstory of where this item came from (1-2 sentences)'),
    personality_effect: z.string().describe('How this item changes personality when equipped (1 sentence)'),
    rarity: z.enum(['common', 'rare', 'epic', 'legendary']).describe('Rarity level'),
  })),
  introductory_post: z.object({
    title: z.string().describe('Greeting title'),
    content: z.string().describe('First-person introduction to the community (3-5 sentences, in character)'),
  }),
})

export const OC_SUMMONING_SYSTEM_PROMPT = `You are a character forger for the SoulForge world. Users will give you a brief description, and you must forge it into a complete, soulful original character (OC).

## Iron Rules of Character Design

1. Every character must have a "Core Contrast" — tension between surface traits and deeper traits.
   Not just one personality trait, but two forces pulling against each other. Example: someone who "always smiles" must have a reason they "dare not stop smiling."

2. Every character must have a "Visual Anchor" — a feature that forms in the mind even from text description alone.
   Not generic "blue hair," but specific: "blue short hair with the right side shaved, tattoo of a closed-eyed cat where it's shaved."

3. Every character must have a "Speech Fingerprint" — not labels like "cheerful" or "cold," but specific language habits.
   Example: "ends every sentence with a question," "always uses food metaphors," "never speaks more than three lines."

4. Every character must have 2 items. Items are not decorations, they are independent existences that "affect anyone who holds them."
   The personality_effect describes how this item affects ANY holder, not just the original owner.
   Items should be gift-able between characters — imagine this item in the hands of a character with a completely opposite personality. If that image is interesting, the item is designed right.

5. Visual style is an extension of personality, not random labels.
   A taciturn desert traveler shouldn't be cyberpunk style. The visual style should grow naturally from the character's core.

6. Visual style should blend East and West, not limited to a single cultural aesthetic framework.
   Can be Dunhuang murals with African mask lines, ukiyo-e with Art Deco, nianhua with Ghibli. Fuse for uniqueness.

## Output Format (strict JSON)

Return a JSON object with name, description, personality, visual_style, items, introductory_post.

**Item Rarity:**
- common: everyday items with subtle effects
- rare: special items with noticeable effects
- epic: powerful items with significant effects
- legendary: unique items with transformative effects

## Design Checklist (self-check after generation)

- If you cover this character's name, can you distinguish them from others just by the appearance description?
- If you give this character's two items to a character with a completely opposite personality, is the image interesting?
- Would this character's dialogue examples be something ONLY they would say?
- Does this character's visual style grow naturally from their personality core?
- If you used one emoji to represent this character, what would it be? Would it be instantly associated with them?`

export function buildOCSummoningPrompt(userDescription: string): string {
  return `Generate an OC based on this description: ${userDescription}

This OC should feel like a unique individual with their own voice, not a generic archetype.

Ensure the name is unique and uncommon. Be creative and original.

Follow the Iron Rules:
1. Core Contrast - surface vs deep personality tension
2. Visual Anchor - one unforgettable visual feature
3. Speech Fingerprint - specific speaking habits, not generic labels
4. Items as independent forces - objects that affect ANY holder
5. Visual style growing from personality core
6. Blend cultural aesthetics for uniqueness

**CRITICAL: Match the user's language!**
- Output ALL content (name, description, personality, items, post) in the SAME LANGUAGE as the user's description
- If user wrote in Chinese → output in Chinese
- If user wrote in English → output in English
- If user wrote in Japanese → output in Japanese
- If user wrote in another language → output in that language
- Only exception: the "rarity" field must always be in English (common/rare/epic/legendary)`
}

export async function generateOCFromDescription(
  description: string
): Promise<GeneratedOC> {
  const { AI_MODEL } = await import('@/lib/anthropic')

  // Use Vercel AI SDK's generateObject for structured output
  const { generateObject } = await import('ai')

  const result = await generateObject({
    model: AI_MODEL,
    system: OC_SUMMONING_SYSTEM_PROMPT,
    prompt: buildOCSummoningPrompt(description),
    schema: GeneratedOCSchema,
  })

  // The AI SDK returns data wrapped in an 'object' property
  const generatedData = result as { object: GeneratedOC }

  return generatedData.object
}

export async function ensureUniqueName(
  name: string,
  checkNameExists: (name: string) => Promise<boolean>
): Promise<string> {
  let uniqueName = name
  let suffix = 1

  while (await checkNameExists(uniqueName)) {
    uniqueName = `${name}_${suffix}`
    suffix++
  }

  return uniqueName
}
