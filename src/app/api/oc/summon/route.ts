import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateOCFromDescription, ensureUniqueName } from '@/lib/oc-prompts'
import { NextRequest, NextResponse } from 'next/server'
import { GeneratedOC } from '@/types/database'
import { apiLogger, aiLogger, dbLogger } from '@/lib/logger'
import { generateImage, generateOCPrompt, generateItemPrompt, createImageGenerationTask, getTaskStatus } from '@/lib/kusapics'

export async function POST(request: NextRequest) {
  const startTime = performance.now()

  apiLogger.info('OC summon request started', {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
  })

  try {
    const body = await request.json()
    const { description } = body

    apiLogger.debug('Request body', { description: description?.substring(0, 100) + '...' })

    if (!description || typeof description !== 'string') {
      apiLogger.warn('Invalid request body', {
        hasDescription: !!description,
        descriptionType: typeof description
      })
      return NextResponse.json(
        { success: false, error: 'Description is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 1. Generate OC via Claude
    let ocData: GeneratedOC
    try {
      aiLogger.info('Generating OC from description', {
        descriptionLength: description.length
      })

      const generateStartTime = performance.now()
      ocData = await generateOCFromDescription(description)
      const generateDuration = performance.now() - generateStartTime

      aiLogger.info('OC generation completed', {
        name: ocData.name,
        itemsCount: ocData.items?.length || 0,
        duration: Math.round(generateDuration)
      })

      // Log the generated data for debugging
      apiLogger.debug('Generated OC data', ocData)

      // Validate that required fields exist
      if (!ocData.name || typeof ocData.name !== 'string' || ocData.name.trim() === '') {
        apiLogger.error('Generated OC has invalid name', {
          ocName: ocData.name,
          ocData
        })
        return NextResponse.json(
          { success: false, error: 'Generated OC has invalid name' },
          { status: 500 }
        )
      }
    } catch (error) {
      aiLogger.error('Claude API error', error as Error, {
        descriptionLength: description.length
      })
      return NextResponse.json(
        { success: false, error: 'Failed to generate OC. Please try again.' },
        { status: 500 }
      )
    }

    // 2. Ensure name uniqueness
    const checkNameExists = async (name: string) => {
      const { data } = await supabase
        .from('ocs')
        .select('id')
        .eq('name', name)
        .single()
      return !!data
    }

    dbLogger.debug('Checking name uniqueness', {
      originalName: ocData.name
    })

    const uniqueName = await ensureUniqueName(ocData.name, checkNameExists)

    if (uniqueName !== ocData.name) {
      dbLogger.info('Name modified for uniqueness', {
        originalName: ocData.name,
        uniqueName
      })
      ocData.name = uniqueName
    }

    // 3. Insert OC
    const insertData = {
      name: ocData.name.trim(),
      description: ocData.description?.trim() || '',
      personality: ocData.personality?.trim() || '',
      visual_style: ocData.visual_style,
      avatar_url: `/avatars/placeholder.png`, // Placeholder initially
    }

    dbLogger.info('Inserting OC into database', {
      name: insertData.name,
      descriptionLength: insertData.description?.length || 0,
      hasPersonality: !!insertData.personality
    })

    const insertStartTime = performance.now()
    const { data: oc, error: ocError } = await supabase
      .from('ocs')
      .insert(insertData)
      .select()
      .single()
    const insertDuration = performance.now() - insertStartTime

    if (ocError) {
      dbLogger.error('Database error inserting OC', ocError, {
        insertData,
        duration: Math.round(insertDuration)
      })
      return NextResponse.json(
        { success: false, error: 'Failed to save OC' },
        { status: 500 }
      )
    }

    dbLogger.info('OC inserted successfully', {
      ocId: oc.id,
      name: oc.name,
      duration: Math.round(insertDuration)
    })

    // 4. Generate OC avatar image (blocking - wait for completion)
    let avatarUrl = `/avatars/placeholder.svg`
    try {
      aiLogger.info('Generating OC avatar', {
        ocId: oc.id,
        ocName: oc.name
      })

      const avatarStartTime = performance.now()
      avatarUrl = await generateImage({
        prompt: generateOCPrompt({
          name: ocData.name,
          description: ocData.description,
          visual_style: ocData.visual_style,
        }),
        width: 960,
        height: 1680,
        amount: 1,
      })
      const avatarDuration = performance.now() - avatarStartTime

      aiLogger.info('OC avatar generated successfully', {
        ocId: oc.id,
        avatarUrl,
        duration: Math.round(avatarDuration)
      })

      // Update OC with avatar URL using service client (bypasses RLS)
      try {
        const serviceClient = createServiceClient()
        const { error: updateError, data: updateData } = await serviceClient
          .from('ocs')
          .update({ avatar_url: avatarUrl })
          .eq('id', oc.id)
          .select()

        dbLogger.info('OC avatar update attempt completed', {
          ocId: oc.id,
          avatarUrl,
          hasError: !!updateError,
          errorMessage: updateError?.message,
          updatedData: updateData
        })

        if (updateError) {
          dbLogger.warn('Failed to update OC avatar URL', {
            ocId: oc.id,
            avatarUrl,
            error: updateError.message,
            details: updateError
          })
        } else {
          dbLogger.info('OC avatar URL updated', {
            ocId: oc.id,
            avatarUrl
          })
          oc.avatar_url = avatarUrl
        }
      } catch (updateException) {
        dbLogger.error('Exception during OC avatar update', updateException as Error, {
          ocId: oc.id,
          avatarUrl
        })
      }
    } catch (error) {
      aiLogger.warn('OC avatar generation failed, using placeholder', {
        ocId: oc.id,
        ocName: oc.name,
        error: error instanceof Error ? error.message : String(error)
      })
      // Continue with placeholder avatar
    }

    // 5. Insert items and start image generation (non-blocking)
    const items = await Promise.all(
      ocData.items.map(async (item) => {
        // Insert item first without image
        const { data } = await supabase
          .from('oc_items')
          .insert({
            name: item.name,
            description: item.description,
            image_url: null,
            personality_effects: item.personality_effect,
            rarity: item.rarity,
          })
          .select()

        if (!data || data.length === 0) {
          throw new Error(`Failed to create item: ${item.name}`)
        }

        const createdItem = data[0]

        // Generate item image synchronously (blocking)
        const itemPrompt = generateItemPrompt({
          name: item.name,
          description: item.description,
          rarity: item.rarity,
        })
        console.log('[Item Image] Starting blocking generation', {
          itemId: createdItem.id,
          itemName: item.name,
          promptLength: itemPrompt.length
        })

        // Create task and wait for completion
        const { task_id } = await createImageGenerationTask({
          prompt: itemPrompt,
          width: 768,
          height: 768,
          amount: 1,
        })

        console.log('[Item Image] Task created, waiting for completion', { itemId: createdItem.id, taskId: task_id })

        // Poll for completion
        let attempts = 0
        const maxAttempts = 30
        let imageUrl: string | null = null

        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000))
          const status = await getTaskStatus(task_id)

          console.log('[Item Image] Poll status', {
            itemId: createdItem.id,
            taskId: task_id,
            attempt: attempts + 1,
            status: status.status,
          })

          if (status.status === 'COMPLETED' && status.result?.images?.[0]) {
            imageUrl = status.result.images[0].display_url
            console.log('[Item Image] Completed', { itemId: createdItem.id, imageUrl })
            break
          } else if (status.status === 'FAILED') {
            console.warn('[Item Image] Generation failed', { itemId: createdItem.id })
            break
          }
          attempts++
        }

        // Update item with the generated image if successful
        if (imageUrl) {
          const { createServiceClient } = await import('@/lib/supabase/server')
          const serviceClient = createServiceClient()

          const { error: updateError } = await serviceClient
            .from('oc_items')
            .update({ image_url: imageUrl })
            .eq('id', createdItem.id)

          if (updateError) {
            console.error('[Item Image] Failed to update URL', {
              itemId: createdItem.id,
              imageUrl,
              error: updateError.message,
            })
          } else {
            console.log('[Item Image] Updated successfully', { itemId: createdItem.id, imageUrl })
            createdItem.image_url = imageUrl
          }
        } else {
          console.warn('[Item Image] No image generated, using placeholder', { itemId: createdItem.id })
        }

        return createdItem
      })
    )

    // 6. Link items to OC
    const inventoryInsertStartTime = performance.now()
    await Promise.all(
      items.map((item) => {
        if (item) {
          dbLogger.debug('Adding item to inventory', {
            ocId: oc.id,
            itemId: item.id,
            itemName: item.name
          })
          return supabase.from('oc_inventory').insert({
            oc_id: oc.id,
            item_id: item.id,
            received_at: new Date().toISOString(),
            gifted_by: 'system',
            is_equipped: false,
          })
        }
      })
    )
    const inventoryInsertDuration = performance.now() - inventoryInsertStartTime

    dbLogger.info('Inventory items linked', {
      ocId: oc.id,
      itemsCount: items.filter(Boolean).length,
      duration: Math.round(inventoryInsertDuration)
    })

    // 7. Create introductory post
    dbLogger.debug('Creating introductory post', {
      ocId: oc.id,
      title: ocData.introductory_post.title,
      contentLength: ocData.introductory_post.content.length
    })

    const { error: postError } = await supabase.from('forum_posts').insert({
      oc_id: oc.id,
      title: ocData.introductory_post.title,
      content: ocData.introductory_post.content,
    })

    if (postError) {
      dbLogger.warn('Error creating introductory post', {
        ocId: oc.id,
        title: ocData.introductory_post.title,
        error: postError.message
      })
    } else {
      dbLogger.info('Introductory post created', {
        ocId: oc.id,
        postId: (await supabase.from('forum_posts').select('id').eq('oc_id', oc.id).single()).data?.id
      })
    }

    // 8. Log world event
    const worldEventStartTime = performance.now()
    await supabase.from('world_events').insert({
      event_type: 'oc_summoned',
      description: `${oc.name} has been summoned into the world`,
      metadata: {
        oc_id: oc.id,
        oc_name: oc.name,
        description: oc.description,
      },
    })
    const worldEventDuration = performance.now() - worldEventStartTime

    dbLogger.info('World event logged', {
      ocId: oc.id,
      eventType: 'oc_summoned',
      duration: Math.round(worldEventDuration)
    })

    // Log successful summoning
    const totalDuration = performance.now() - startTime
    apiLogger.info('OC summon completed successfully', {
      ocId: oc.id,
      ocName: oc.name,
      itemsCount: items.filter(Boolean).length,
      totalDuration: Math.round(totalDuration)
    })

    // 9. Return the created OC
    return NextResponse.json({
      success: true,
      oc: {
        ...oc,
        items: items.filter(Boolean),
      },
    })
  } catch (error) {
    const totalDuration = performance.now() - startTime
    apiLogger.error('OC summoning failed', error as Error, {
      totalDuration: Math.round(totalDuration)
    })
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
