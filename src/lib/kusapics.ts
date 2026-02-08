/**
 * KusaPics B2B API Client
 * Text-to-image generation service
 */

const KUSAPICS_API_BASE = 'https://api.kusa.pics/api/go/b2b/tasks'

export interface KusaPicsImageGenerateParams {
  prompt: string
  negative_prompt?: string
  style_id?: string
  width?: number
  height?: number
  amount?: number
}

export interface KusaPicsTaskResponse {
  code: number
  message: string
  data: {
    task_id: string
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
    result?: {
      image_count: number
      images: Array<{
        content_type: string
        display_url: string
        file_size: number
        height: number
        index: number
        width: number
      }>
    }
    estimated_time_seconds?: number
    error_message?: string
  }
}

export type TaskStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'

/**
 * Create a text-to-image generation task
 */
export async function createImageGenerationTask(
  params: KusaPicsImageGenerateParams
): Promise<{ task_id: string; status: TaskStatus }> {
  const apiKey = process.env.KUSAPICS_API_KEY

  if (!apiKey) {
    console.error('[KusaPics] KUSAPICS_API_KEY is not configured')
    throw new Error('KUSAPICS_API_KEY is not configured')
  }

  const requestBody = {
    task_type: 'TEXT_TO_IMAGE',
    params: {
      prompt: params.prompt,
      negative_prompt: params.negative_prompt || 'nsfw, nude, naked, sexual, explicit, adult, mature, 18+',
      style_id: params.style_id || '1',
      width: params.width || 960,
      height: params.height || 1680,
      amount: params.amount || 1,
    },
  }

  console.log('[KusaPics] Creating image generation task...', {
    promptLength: params.prompt.length,
    width: params.width || 960,
    height: params.height || 1680,
  })

  const response = await fetch(`${KUSAPICS_API_BASE}/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify(requestBody),
  })

  console.log('[KusaPics] Create task response status:', response.status)

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[KusaPics] API error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    })
    throw new Error(`KusaPics API error: ${response.status} ${response.statusText}`)
  }

  const data: KusaPicsTaskResponse = await response.json()
  console.log('[KusaPics] Create task response:', { code: data.code, message: data.message, taskId: data.data?.task_id })

  if (data.code !== 0) {
    console.error('[KusaPics] API returned error code:', data)
    throw new Error(`KusaPics API error: ${data.message}`)
  }

  return {
    task_id: data.data.task_id,
    status: data.data.status,
  }
}

/**
 * Query task status and result
 */
export async function getTaskStatus(
  taskId: string
): Promise<{
  status: TaskStatus
  result?: KusaPicsTaskResponse['data']['result']
  estimatedTimeSeconds?: number
  errorMessage?: string
}> {
  const apiKey = process.env.KUSAPICS_API_KEY

  if (!apiKey) {
    throw new Error('KUSAPICS_API_KEY is not configured')
  }

  console.log('[KusaPics] Querying task status:', taskId)

  const response = await fetch(`${KUSAPICS_API_BASE}/get`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({ task_id: taskId }),
  })

  if (!response.ok) {
    console.error('[KusaPics] getTaskStatus HTTP error:', response.status, response.statusText)
    throw new Error(`KusaPics API error: ${response.status} ${response.statusText}`)
  }

  const data: KusaPicsTaskResponse = await response.json()

  console.log('[KusaPics] getTaskStatus response:', {
    code: data.code,
    message: data.message,
    status: data.data?.status,
    hasResult: !!data.data?.result,
    result: data.data?.result
  })

  if (data.code !== 0) {
    console.error('[KusaPics] getTaskStatus error code:', data)
    throw new Error(`KusaPics API error: ${data.message}`)
  }

  return {
    status: data.data.status,
    result: data.data.result,
    estimatedTimeSeconds: data.data.estimated_time_seconds,
    errorMessage: data.data.error_message,
  }
}

/**
 * Poll task status until completion or failure
 */
export async function pollTaskUntilComplete(
  taskId: string,
  options: {
    maxAttempts?: number
    pollIntervalMs?: number
  } = {}
): Promise<{
  status: 'COMPLETED' | 'FAILED'
  result?: KusaPicsTaskResponse['data']['result']
  errorMessage?: string
}> {
  const { maxAttempts = 30, pollIntervalMs = 2000 } = options

  console.log('[KusaPics] Starting poll for task:', taskId, 'maxAttempts:', maxAttempts, 'pollIntervalMs:', pollIntervalMs)

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const taskStatus = await getTaskStatus(taskId)

    console.log(`[KusaPics] Poll attempt ${attempt + 1}/${maxAttempts}:`, {
      taskId,
      status: taskStatus.status,
      hasResult: !!taskStatus.result,
      imageUrl: taskStatus.result?.images?.[0]?.display_url
    })

    if (taskStatus.status === 'COMPLETED') {
      console.log('[KusaPics] Task COMPLETED:', {
        taskId,
        imageUrl: taskStatus.result?.images?.[0]?.display_url
      })
      return {
        status: 'COMPLETED',
        result: taskStatus.result,
      }
    }

    if (taskStatus.status === 'FAILED') {
      console.error('[KusaPics] Task FAILED:', {
        taskId,
        errorMessage: taskStatus.errorMessage
      })
      return {
        status: 'FAILED',
        errorMessage: taskStatus.errorMessage,
      }
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
  }

  console.error('[KusaPics] Task polling timeout:', { taskId, maxAttempts })
  throw new Error(`Task polling timeout after ${maxAttempts} attempts`)
}

/**
 * Generate an image with automatic polling
 */
export async function generateImage(
  params: KusaPicsImageGenerateParams,
  options: {
    maxAttempts?: number
    pollIntervalMs?: number
  } = {}
): Promise<string> {
  const { task_id } = await createImageGenerationTask(params)

  const result = await pollTaskUntilComplete(task_id, options)

  if (result.status === 'FAILED') {
    throw new Error(`Image generation failed: ${result.errorMessage}`)
  }

  if (!result.result?.images || result.result.images.length === 0) {
    throw new Error('No images generated')
  }

  return result.result.images[0].display_url
}

/**
 * Generate image from OC description
 * Converts OC visual style and description into a detailed English prompt
 * Note: KusaPics API requires English prompts for best results
 */
export function generateOCPrompt(oc: {
  name: string
  description: string
  visual_style?: {
    background: string
    primaryColor: string
    accentColor: string
    mood: string
    atmosphere: string
  }
}): string {
  const { name, description, visual_style } = oc

  // Build a detailed English prompt for image generation
  // Using standard anime/art tags that work well with image models
  const parts = [
    '1girl, solo', // Base tags
    'anime style, detailed, high quality',
    'portrait, upper body',
  ]

  // Add mood/expression based on visual style (with Chinese to English mapping)
  if (visual_style) {
    const moodMap: Record<string, string> = {
      '开心': 'happy, cheerful, smiling',
      '悲伤': 'sad, melancholic, crying',
      '愤怒': 'angry, fierce, intense',
      '害羞': 'shy, blushing, timid',
      '冷静': 'calm, composed, serene',
      '神秘': 'mysterious, enigmatic',
      '活泼': 'energetic, lively, dynamic',
      '温柔': 'gentle, kind, soft',
    }

    const moodKey = Object.keys(moodMap).find(k => visual_style.mood?.includes(k))
    if (moodKey) {
      parts.push(moodMap[moodKey])
    } else {
      // Default expression if no match
      parts.push('pleasant expression')
    }

    // Add color descriptions
    const colorMap: Record<string, string> = {
      '红': 'red',
      '蓝': 'blue',
      '绿': 'green',
      '黄': 'yellow',
      '紫': 'purple',
      '粉': 'pink',
      '黑': 'black',
      '白': 'white',
      '金': 'gold',
      '银': 'silver',
    }

    let colorDescription = ''
    Object.entries(colorMap).forEach(([cn, en]) => {
      if (visual_style.primaryColor?.includes(cn)) {
        colorDescription += `${en} themed outfit, `
      }
      if (visual_style.accentColor?.includes(cn)) {
        colorDescription += `${en} accessories, `
      }
    })

    if (colorDescription) {
      parts.push(colorDescription.trim())
    }

    // Add background style
    if (visual_style.background) {
      parts.push('simple background, soft lighting')
    }
  }

  // Add character name as a reference (though AI won't know specific OCs)
  parts.push(`character portrait, ${name}`)

  return parts.join(', ')
}

/**
 * Generate image for item
 * Note: KusaPics requires English prompts for image generation
 * The item description can be Chinese (for display), but we translate for the prompt
 */
export function generateItemPrompt(item: {
  name: string
  description: string
  rarity: string
}): string {
  // Translate rarity to English
  const rarityMap: Record<string, string> = {
    '普通': 'common',
    '稀有': 'rare',
    '史诗': 'epic',
    '传说': 'legendary',
  }

  const rarityEn = rarityMap[item.rarity] || 'rare'

  // Build English prompt for image generation
  // Using standard anime/game item tags
  const tags = [
    'game item',
    'object',
    `${rarityEn} item`,
    'detailed',
    'high quality',
    'centered',
    'simple background',
    'anime style',
  ]

  return tags.join(', ')
}
