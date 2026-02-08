import { generateImage, generateOCPrompt, generateItemPrompt } from '@/lib/kusapics'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json()

    if (!type || !data) {
      return NextResponse.json(
        { success: false, error: 'Type and data are required' },
        { status: 400 }
      )
    }

    let prompt: string
    let imageUrl: string

    if (type === 'oc') {
      // Generate image for OC
      const { name, description, visual_style } = data
      prompt = generateOCPrompt({ name, description, visual_style })
    } else if (type === 'item') {
      // Generate image for item
      const { name, description, rarity } = data
      prompt = generateItemPrompt({ name, description, rarity })
    } else if (type === 'custom') {
      // Custom prompt
      prompt = data.prompt
      if (!prompt) {
        return NextResponse.json(
          { success: false, error: 'Prompt is required for custom type' },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Must be "oc", "item", or "custom"' },
        { status: 400 }
      )
    }

    // Generate image with KusaPics
    imageUrl = await generateImage(
      {
        prompt,
        width: data.width || 960,
        height: data.height || 1680,
        style_id: data.style_id || '1',
        amount: 1,
      },
      {
        maxAttempts: 30,
        pollIntervalMs: 2000,
      }
    )

    return NextResponse.json({
      success: true,
      imageUrl,
    })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate image',
      },
      { status: 500 }
    )
  }
}
