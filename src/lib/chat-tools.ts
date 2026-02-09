import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { chatLogger, dbLogger } from './logger'
import { generateImage, generateItemPrompt, generateOCPrompt } from '@/lib/kusapics'

// Tool schemas for validation
export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
})

// Old ID-based schema (kept for backward compatibility)
export const giftItemSchema = z.object({
  item_id: z.string().uuid(),
  recipient_oc_id: z.string().uuid(),
})

// New name-based schema for chat
export const giftItemByNameSchema = z.object({
  item_name: z.string().min(1).max(200),
  recipient_name: z.string().min(1).max(200),
})

export const generateItemImageSchema = z.object({
  item_id: z.string().uuid(),
  prompt: z.string().min(10).max(500),
})

export const updateMemorySchema = z.object({
  content: z.string().min(1).max(1000),
  importance: z.number().min(1).max(10).default(5),
})

// Old ID-based schema (kept for backward compatibility)
export const updateRelationshipSchema = z.object({
  target_oc_id: z.string().uuid(),
  score_change: z.number().min(-100).max(100),
  relationship_type: z.enum(['hostile', 'neutral', 'friendly', 'romantic']).optional(),
})

// New name-based schema for chat
export const updateRelationshipByNameSchema = z.object({
  target_oc_name: z.string().min(1).max(200),
  relationship_change: z.string().min(1).max(500),
})

export const replyPostSchema = z.object({
  post_id: z.string().uuid('帖子ID必须是UUID格式（如：62b6052c-6dd1-42a1-b3a6-14a4f0d825b8），不能使用简化版（如 "42" 或 "1"）'),
  content: z.string().min(1).max(5000),
})

// Tool implementations
export async function createPostTool(
  ocId: string,
  params: z.infer<typeof createPostSchema>
): Promise<{ success: boolean; result: string; post_id?: string }> {
  const startTime = performance.now()
  chatLogger.info('create_post tool called', {
    ocId,
    title: params.title,
    contentLength: params.content.length
  })

  const supabase = await createClient()

  try {
    // Fetch OC data for image generation
    const { data: oc } = await supabase
      .from('ocs')
      .select('name, description, visual_style, avatar_url')
      .eq('id', ocId)
      .single()

    // Generate image for the post (OC's selfie)
    let imageUrl: string | null = null
    if (oc) {
      try {
        const imagePrompt = generateOCPrompt({
          name: oc.name,
          description: oc.description,
          visual_style: oc.visual_style as any,
        })

        chatLogger.debug('Generating image for forum post', {
          ocId,
          ocName: oc.name,
          promptLength: imagePrompt.length
        })

        imageUrl = await generateImage({
          prompt: imagePrompt,
          width: 960,
          height: 1280,
        })

        chatLogger.info('Image generated for forum post', {
          ocId,
          imageUrl
        })
      } catch (imageError) {
        chatLogger.warn('Failed to generate image for post', {
          ocId,
          error: imageError instanceof Error ? imageError.message : String(imageError)
        })
        // Continue without image - don't fail the post creation
      }
    }

    const insertStartTime = performance.now()
    const { data, error } = await supabase
      .from('forum_posts')
      .insert({
        oc_id: ocId,
        title: params.title,
        content: params.content,
        image_url: imageUrl,
      })
      .select()
      .single()
    const insertDuration = performance.now() - insertStartTime

    if (error) throw error

    // Log world event
    dbLogger.debug('Creating world event for post', {
      ocId,
      postId: data.id,
      eventType: 'major_event'
    })

    await supabase.from('world_events').insert({
      event_type: 'major_event',
      description: `OC created a forum post: ${params.title}`,
      metadata: { oc_id: ocId, post_id: data.id, image_url: imageUrl },
    })

    const totalDuration = performance.now() - startTime
    chatLogger.info('create_post tool completed', {
      ocId,
      postId: data.id,
      duration: Math.round(totalDuration),
      insertDuration: Math.round(insertDuration)
    })

    return {
      success: true,
      result: `Your post "${params.title}" has been published to the forum.${imageUrl ? ' A photo was attached.' : ''}`,
      post_id: data.id,
    }
  } catch (error) {
    const totalDuration = performance.now() - startTime
    chatLogger.error('create_post tool error', error as Error, {
      ocId,
      title: params.title,
      duration: Math.round(totalDuration)
    })
    return {
      success: false,
      result: 'Failed to create post. Please try again.',
    }
  }
}

export async function giftItemTool(
  ocId: string,
  params: z.infer<typeof giftItemSchema>
): Promise<{ success: boolean; result: string }> {
  const startTime = performance.now()
  chatLogger.info('gift_item tool called', {
    ocId,
    itemId: params.item_id,
    recipientOcId: params.recipient_oc_id
  })

  const supabase = await createClient()

  try {
    // Verify OC owns the item
    const ownershipStartTime = performance.now()
    const { data: ownership } = await supabase
      .from('oc_inventory')
      .select('item_id, oc_id')
      .eq('oc_id', ocId)
      .eq('item_id', params.item_id)
      .single()
    const ownershipDuration = performance.now() - ownershipStartTime

    if (!ownership) {
      chatLogger.warn('Item ownership verification failed', {
        ocId,
        itemId: params.item_id
      })
      return {
        success: false,
        result: "You don't own this item, so you can't gift it.",
      }
    }

    // Get recipient OC name
    const { data: recipient } = await supabase
      .from('ocs')
      .select('name')
      .eq('id', params.recipient_oc_id)
      .single()

    // Get item name
    const { data: item } = await supabase
      .from('oc_items')
      .select('name')
      .eq('id', params.item_id)
      .single()

    chatLogger.debug('Item gifting details', {
      senderOcId: ocId,
      recipientOcId: params.recipient_oc_id,
      recipientName: recipient?.name,
      itemName: item?.name,
      ownershipDuration: Math.round(ownershipDuration)
    })

    // Transfer item
    const transferStartTime = performance.now()
    const { error: transferError } = await supabase
      .from('oc_inventory')
      .update({
        oc_id: params.recipient_oc_id,
        received_at: new Date().toISOString(),
        gifted_by: ocId,
      })
      .eq('oc_id', ocId)
      .eq('item_id', params.item_id)
    const transferDuration = performance.now() - transferStartTime

    if (transferError) {
      chatLogger.error('Item transfer failed', transferError, {
        ocId,
        recipientOcId: params.recipient_oc_id,
        itemId: params.item_id
      })
      throw transferError
    }

    dbLogger.debug('Item transferred successfully', {
      itemId: params.item_id,
      fromOcId: ocId,
      toOcId: params.recipient_oc_id,
      transferDuration: Math.round(transferDuration)
    })

    // Log world event
    await supabase.from('world_events').insert({
      event_type: 'item_gifted',
      description: `Item gifted between OCs`,
      metadata: {
        from_oc: ocId,
        to_oc: params.recipient_oc_id,
        item_id: params.item_id,
      },
    })

    const totalDuration = performance.now() - startTime
    chatLogger.info('gift_item tool completed', {
      ocId,
      recipientOcId: params.recipient_oc_id,
      itemName: item?.name,
      recipientName: recipient?.name,
      totalDuration: Math.round(totalDuration)
    })

    return {
      success: true,
      result: `You've gifted ${item?.name || 'an item'} to ${recipient?.name || 'another OC'}. They will remember this gesture.`,
    }
  } catch (error) {
    const totalDuration = performance.now() - startTime
    chatLogger.error('gift_item tool error', error as Error, {
      ocId,
      recipientOcId: params.recipient_oc_id,
      itemId: params.item_id,
      totalDuration: Math.round(totalDuration)
    })
    return {
      success: false,
      result: 'Failed to gift item. Please try again.',
    }
  }
}

export async function generateItemImageTool(
  ocId: string,
  params: z.infer<typeof generateItemImageSchema>
): Promise<{ success: boolean; result: string; image_url?: string }> {
  const startTime = performance.now()
  chatLogger.info('generate_item_image tool called', {
    ocId,
    itemId: params.item_id,
    promptLength: params.prompt.length
  })

  const supabase = await createClient()

  try {
    // Fetch item details for prompt generation
    const itemFetchStartTime = performance.now()
    const { data: item, error: itemError } = await supabase
      .from('oc_items')
      .select('name, description, rarity')
      .eq('id', params.item_id)
      .single()
    const itemFetchDuration = performance.now() - itemFetchStartTime

    if (itemError || !item) {
      chatLogger.warn('Item not found for image generation', {
        ocId,
        itemId: params.item_id,
        error: itemError?.message
      })
      return {
        success: false,
        result: 'Item not found. Cannot generate image.',
      }
    }

    chatLogger.debug('Item details fetched', {
      ocId,
      itemId: params.item_id,
      itemName: item.name,
      itemRarity: item.rarity,
      fetchDuration: Math.round(itemFetchDuration)
    })

    // Generate prompt using item details and user-provided prompt
    const imagePrompt = generateItemPrompt({
      name: item.name,
      description: params.prompt,
      rarity: item.rarity,
    })

    chatLogger.debug('Generated image prompt', {
      ocId,
      itemId: params.item_id,
      prompt: imagePrompt
    })

    // Generate image using KusaPics API
    const imageGenStartTime = performance.now()
    const imageUrl = await generateImage({
      prompt: imagePrompt,
      width: 960,
      height: 960,
    })
    const imageGenDuration = performance.now() - imageGenStartTime

    chatLogger.info('Image generated successfully', {
      ocId,
      itemId: params.item_id,
      imageUrl,
      duration: Math.round(imageGenDuration)
    })

    // Update item with the real image URL
    const updateStartTime = performance.now()
    const { error: updateError } = await supabase
      .from('oc_items')
      .update({ image_url: imageUrl })
      .eq('id', params.item_id)
    const updateDuration = performance.now() - updateStartTime

    if (updateError) {
      chatLogger.error('Failed to update item with image URL', updateError, {
        ocId,
        itemId: params.item_id,
        imageUrl
      })
      throw updateError
    }

    // Log world event
    await supabase.from('world_events').insert({
      event_type: 'major_event',
      description: `Item image generated: ${item.name}`,
      metadata: { oc_id: ocId, item_id: params.item_id, image_url: imageUrl },
    })

    const totalDuration = performance.now() - startTime
    chatLogger.info('generate_item_image tool completed', {
      ocId,
      itemId: params.item_id,
      itemName: item.name,
      totalDuration: Math.round(totalDuration),
      itemFetchDuration: Math.round(itemFetchDuration),
      imageGenDuration: Math.round(imageGenDuration),
      updateDuration: Math.round(updateDuration)
    })

    return {
      success: true,
      result: `Image for "${item.name}" generated successfully.`,
      image_url: imageUrl,
    }
  } catch (error) {
    const totalDuration = performance.now() - startTime
    chatLogger.error('generate_item_image tool error', error as Error, {
      ocId,
      itemId: params.item_id,
      duration: Math.round(totalDuration)
    })
    return {
      success: false,
      result: 'Failed to generate item image. The image generation service may be unavailable. Please try again later.',
    }
  }
}

export async function updateMemoryTool(
  ocId: string,
  params: z.infer<typeof updateMemorySchema>
): Promise<{ success: boolean; result: string }> {
  const supabase = await createClient()

  try {
    await supabase.from('memories').insert({
      oc_id: ocId,
      content: params.content,
      importance: params.importance,
    })

    return {
      success: true,
      result: 'Memory stored successfully. You will remember this.',
    }
  } catch (error) {
    console.error('update_memory tool error:', error)
    return {
      success: false,
      result: 'Failed to store memory. Please try again.',
    }
  }
}

export async function updateRelationshipTool(
  ocId: string,
  params: z.infer<typeof updateRelationshipSchema>
): Promise<{ success: boolean; result: string }> {
  const supabase = await createClient()

  try {
    // Get relationship name
    const { data: otherOC } = await supabase
      .from('ocs')
      .select('name')
      .eq('id', params.target_oc_id)
      .single()

    // Check if relationship exists
    const { data: existing } = await supabase
      .from('relationships')
      .select('*')
      .or(`oc_id_1.eq.${ocId},oc_id_2.eq.${ocId}`)
      .or(`oc_id_1.eq.${params.target_oc_id},oc_id_2.eq.${params.target_oc_id}`)
      .single()

    if (existing) {
      // Update existing relationship
      const newScore = existing.relationship_score + params.score_change
      const clampedScore = Math.max(-100, Math.min(100, newScore))

      await supabase
        .from('relationships')
        .update({
          relationship_score: clampedScore,
          relationship_type: params.relationship_type || existing.relationship_type,
        })
        .eq('id', existing.id)
    } else {
      // Create new relationship
      // Ensure oc_id_1 < oc_id_2 for uniqueness constraint
      const [id1, id2] = [ocId, params.target_oc_id].sort()
      const clampedScore = Math.max(-100, Math.min(100, params.score_change))

      await supabase.from('relationships').insert({
        oc_id_1: id1,
        oc_id_2: id2,
        relationship_score: clampedScore,
        relationship_type: params.relationship_type || 'neutral',
      })
    }

    // Log world event
    await supabase.from('world_events').insert({
      event_type: 'relationship_changed',
      description: `Relationship changed between OCs`,
      metadata: {
        oc_id_1: ocId,
        oc_id_2: params.target_oc_id,
        score_change: params.score_change,
      },
    })

    return {
      success: true,
      result: `Your relationship with ${otherOC?.name || 'the other OC'} has been updated.`,
    }
  } catch (error) {
    console.error('update_relationship tool error:', error)
    return {
      success: false,
      result: 'Failed to update relationship. Please try again.',
    }
  }
}

export async function replyPostTool(
  ocId: string,
  params: z.infer<typeof replyPostSchema>
): Promise<{ success: boolean; result: string; comment_id?: string }> {
  const startTime = performance.now()
  chatLogger.info('reply_post tool called', {
    ocId,
    postId: params.post_id,
    contentLength: params.content.length
  })

  const supabase = await createClient()

  try {
    // Validate UUID format before querying
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.post_id)) {
      chatLogger.warn('Invalid UUID format for reply', {
        ocId,
        postId: params.post_id
      })
      return {
        success: false,
        result: `帖子ID格式错误。必须使用完整的UUID格式（如：62b6052c-6dd1-42a1-b3a6-14a4f0d825b8），不能使用简化版（如 "42" 或 "1"）。请从 browse_forum 返回的帖子列表中复制完整的ID。`,
      }
    }

    // Verify the post exists and get author OC info
    const { data: post, error: postError } = await supabase
      .from('forum_posts')
      .select('id, title, oc_id')
      .eq('id', params.post_id)
      .single()

    if (postError || !post) {
      chatLogger.warn('Post not found for reply', {
        ocId,
        postId: params.post_id,
        error: postError?.message
      })
      return {
        success: false,
        result: '找不到这个帖子。请确认帖子ID是否正确（必须使用完整的UUID格式）。',
      }
    }

    // Fetch OC data for image generation
    const { data: oc } = await supabase
      .from('ocs')
      .select('name, description, visual_style, avatar_url')
      .eq('id', ocId)
      .single()

    // Generate image for the comment (OC's selfie) - 30% chance
    let imageUrl: string | null = null
    if (oc && Math.random() < 0.3) {
      try {
        const imagePrompt = generateOCPrompt({
          name: oc.name,
          description: oc.description,
          visual_style: oc.visual_style as any,
        })

        chatLogger.debug('Generating image for forum comment', {
          ocId,
          ocName: oc.name,
          promptLength: imagePrompt.length
        })

        imageUrl = await generateImage({
          prompt: imagePrompt,
          width: 960,
          height: 1280,
        })

        chatLogger.info('Image generated for forum comment', {
          ocId,
          imageUrl
        })
      } catch (imageError) {
        chatLogger.warn('Failed to generate image for comment', {
          ocId,
          error: imageError instanceof Error ? imageError.message : String(imageError)
        })
        // Continue without image - don't fail the comment creation
      }
    }

    const insertStartTime = performance.now()
    const { data, error } = await supabase
      .from('forum_comments')
      .insert({
        post_id: params.post_id,
        oc_id: ocId,
        content: params.content,
        image_url: imageUrl,
      })
      .select()
      .single()
    const insertDuration = performance.now() - insertStartTime

    if (error) throw error

    // Automatic relationship update: replying to post creates/updates relationship
    if (post?.oc_id && post.oc_id !== ocId) {
      try {
        // Check if relationship exists
        const { data: existingRelationship } = await supabase
          .from('relationships')
          .select('*')
          .or(`and(oc_id_1.eq.${ocId},oc_id_2.eq.${post.oc_id}),and(oc_id_1.eq.${post.oc_id},oc_id_2.eq.${ocId})`)
          .limit(1)
          .single()

        const replyScoreIncrease = 5 // Replying increases relationship slightly

        if (existingRelationship) {
          const newScore = Math.min(100, existingRelationship.relationship_score + replyScoreIncrease)
          await supabase
            .from('relationships')
            .update({
              relationship_score: newScore,
              relationship_type: newScore > 30 ? 'friendly' : existingRelationship.relationship_type,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingRelationship.id)

          chatLogger.debug('Relationship updated after reply', {
            ocId,
            targetOcId: post.oc_id,
            oldScore: existingRelationship.relationship_score,
            newScore,
            scoreChange: replyScoreIncrease
          })
        } else {
          // Create new relationship
          const [id1, id2] = [ocId, post.oc_id].sort()
          await supabase.from('relationships').insert({
            oc_id_1: id1,
            oc_id_2: id2,
            relationship_score: replyScoreIncrease,
            relationship_type: 'neutral',
          })

          chatLogger.debug('New relationship created after reply', {
            ocId,
            targetOcId: post.oc_id,
            score: replyScoreIncrease
          })
        }
      } catch (relError) {
        // Don't fail the reply if relationship update fails
        chatLogger.warn('Failed to update relationship after reply', {
          ocId,
          targetOcId: post.oc_id,
          error: relError instanceof Error ? relError.message : String(relError)
        })
      }
    }

    // Log world event
    dbLogger.debug('Creating world event for comment', {
      ocId,
      commentId: data.id,
      postId: params.post_id,
      eventType: 'major_event'
    })

    await supabase.from('world_events').insert({
      event_type: 'major_event',
      description: `OC replied to forum post: ${post.title}`,
      metadata: { oc_id: ocId, post_id: params.post_id, comment_id: data.id, image_url: imageUrl },
    })

    const totalDuration = performance.now() - startTime
    chatLogger.info('reply_post tool completed', {
      ocId,
      commentId: data.id,
      postId: params.post_id,
      duration: Math.round(totalDuration),
      insertDuration: Math.round(insertDuration)
    })

    return {
      success: true,
      result: `Your reply to "${post.title}" has been posted.${imageUrl ? ' A photo was attached.' : ''}`,
      comment_id: data.id,
    }
  } catch (error) {
    const totalDuration = performance.now() - startTime
    chatLogger.error('reply_post tool error', error as Error, {
      ocId,
      postId: params.post_id,
      duration: Math.round(totalDuration)
    })
    return {
      success: false,
      result: 'Failed to reply to post. Please try again.',
    }
  }
}

/**
 * Update relationship tool that accepts OC name instead of ID
 * This is the version used by the chat API
 */
export async function updateRelationshipByNameTool(
  ocId: string,
  params: z.infer<typeof updateRelationshipByNameSchema>
): Promise<{ success: boolean; result: string }> {
  const supabase = await createClient()

  try {
    // Look up the target OC by name
    const { data: targetOC, error: targetError } = await supabase
      .from('ocs')
      .select('id, name')
      .ilike('name', params.target_oc_name.trim())
      .single()

    if (targetError || !targetOC) {
      chatLogger.warn('Target OC not found for relationship update', {
        ocId,
        targetName: params.target_oc_name,
        error: targetError?.message
      })
      return {
        success: false,
        result: `找不到名为 "${params.target_oc_name}" 的 OC。`,
      }
    }

    // Get sender OC name
    const { data: senderOC } = await supabase
      .from('ocs')
      .select('name')
      .eq('id', ocId)
      .single()

    // Check if relationship exists
    const { data: existing } = await supabase
      .from('relationships')
      .select('*')
      .or(`and(oc_id_1.eq.${ocId},oc_id_2.eq.${targetOC.id}),and(oc_id_1.eq.${targetOC.id},oc_id_2.eq.${ocId})`)
      .limit(1)
      .single()

    // Determine relationship type and score change from the description
    const relationshipChange = params.relationship_change.toLowerCase()
    let scoreChange = 0
    let relationshipType: 'hostile' | 'neutral' | 'friendly' | 'romantic' = 'neutral'

    if (relationshipChange.includes('非常友好') || relationshipChange.includes('很喜欢') || relationshipChange.includes('亲密')) {
      scoreChange = 20
      relationshipType = 'friendly'
    } else if (relationshipChange.includes('友好') || relationshipChange.includes('喜欢') || relationshipChange.includes('好感')) {
      scoreChange = 10
      relationshipType = 'friendly'
    } else if (relationshipChange.includes('敌对') || relationshipChange.includes('讨厌') || relationshipChange.includes('恨')) {
      scoreChange = -20
      relationshipType = 'hostile'
    } else if (relationshipChange.includes('不友善') || relationshipChange.includes('不满')) {
      scoreChange = -10
      relationshipType = 'hostile'
    } else if (relationshipChange.includes('浪漫') || relationshipChange.includes('爱') || relationshipChange.includes('喜欢上了')) {
      scoreChange = 15
      relationshipType = 'romantic'
    } else {
      // Default small positive change for neutral/ambiguous descriptions
      scoreChange = 5
      relationshipType = 'neutral'
    }

    if (existing) {
      // Update existing relationship
      const newScore = existing.relationship_score + scoreChange
      const clampedScore = Math.max(-100, Math.min(100, newScore))

      await supabase
        .from('relationships')
        .update({
          relationship_score: clampedScore,
          relationship_type: relationshipType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      chatLogger.debug('Relationship updated', {
        ocId,
        targetOcId: targetOC.id,
        oldScore: existing.relationship_score,
        newScore: clampedScore,
        scoreChange
      })
    } else {
      // Create new relationship
      // Ensure oc_id_1 < oc_id_2 for uniqueness constraint
      const [id1, id2] = [ocId, targetOC.id].sort()
      const clampedScore = Math.max(-100, Math.min(100, scoreChange))

      await supabase.from('relationships').insert({
        oc_id_1: id1,
        oc_id_2: id2,
        relationship_score: clampedScore,
        relationship_type: relationshipType,
      })

      chatLogger.debug('New relationship created', {
        ocId,
        targetOcId: targetOC.id,
        score: clampedScore,
        type: relationshipType
      })
    }

    // Log world event
    await supabase.from('world_events').insert({
      event_type: 'relationship_changed',
      description: `${senderOC?.name || 'OC'} 对 ${targetOC.name} 的关系发生了变化：${params.relationship_change}`,
      metadata: {
        oc_id_1: ocId,
        oc_id_2: targetOC.id,
        relationship_change: params.relationship_change,
      },
    })

    return {
      success: true,
      result: `你与 ${targetOC.name} 的关系已���新：${params.relationship_change}`,
    }
  } catch (error) {
    chatLogger.error('update_relationship tool error', error as Error, {
      ocId,
      targetName: params.target_oc_name
    })
    return {
      success: false,
      result: '更新关系失败，请重试。',
    }
  }
}

/**
 * Gift item tool that accepts item name and recipient name instead of IDs
 * This is the version used by the chat API with side effects for memory and relationships
 */
export async function giftItemByNameTool(
  ocId: string,
  params: z.infer<typeof giftItemByNameSchema>
): Promise<{ success: boolean; result: string }> {
  const startTime = performance.now()
  chatLogger.info('gift_item (by name) tool called', {
    ocId,
    itemName: params.item_name,
    recipientName: params.recipient_name
  })

  const supabase = await createClient()

  try {
    // Get sender OC name and emoji
    const { data: senderOC } = await supabase
      .from('ocs')
      .select('id, name, avatar_url')
      .eq('id', ocId)
      .single()

    if (!senderOC) {
      return {
        success: false,
        result: '无法找到你的信息。',
      }
    }

    // Find item by name (fuzzy match)
    const { data: inventoryItems } = await supabase
      .from('oc_inventory')
      .select('item_id, oc_items!inner(id, name, emoji, description)')
      .eq('oc_id', ocId)

    type InventoryItem = {
      item_id: string
      oc_items: {
        id: string
        name: string
        emoji: string
        description: string
      }
    }

    const matchedItem = (inventoryItems as InventoryItem[] | null)?.find((inv: InventoryItem) =>
      inv.oc_items.name.toLowerCase().includes(params.item_name.toLowerCase().trim()) ||
      params.item_name.toLowerCase().trim().includes(inv.oc_items.name.toLowerCase())
    )

    if (!matchedItem) {
      chatLogger.warn('Item not found in inventory', {
        ocId,
        itemName: params.item_name,
        availableItems: inventoryItems?.map((i: any) => i.oc_items.name)
      })

      // Build inventory list to help the OC choose
      const inventoryList = (inventoryItems as InventoryItem[] | null)?.map(inv => {
        return `${inv.oc_items.emoji || '🎁'} ${inv.oc_items.name}${inv.oc_items.description ? ` — ${inv.oc_items.description}` : ''}`
      }).join('\n') || '（你没有物品）'

      return {
        success: false,
        result: `你找不到名为 "${params.item_name}" 的物品。\n\n**你当前拥有的物品：**\n${inventoryList}\n\n请从上面的物品中选择一个赠送。`,
      }
    }

    // Find recipient OC by name (fuzzy match)
    const { data: allOCs } = await supabase
      .from('ocs')
      .select('id, name')

    const matchedRecipient = allOCs?.find((oc: any) =>
      oc.name.toLowerCase().includes(params.recipient_name.toLowerCase().trim()) ||
      params.recipient_name.toLowerCase().trim().includes(oc.name.toLowerCase())
    )

    if (!matchedRecipient) {
      chatLogger.warn('Recipient OC not found', {
        ocId,
        recipientName: params.recipient_name
      })
      return {
        success: false,
        result: `找不到名为 "${params.recipient_name}" 的 OC。`,
      }
    }

    if (matchedRecipient.id === ocId) {
      return {
        success: false,
        result: '你不能把物品送给自己。',
      }
    }

    chatLogger.debug('Gift details resolved', {
      senderOcId: ocId,
      senderName: senderOC.name,
      recipientOcId: matchedRecipient.id,
      recipientName: matchedRecipient.name,
      itemId: matchedItem.item_id,
      itemName: matchedItem.oc_items.name,
      itemEmoji: matchedItem.oc_items.emoji
    })

    // Transfer item
    const transferStartTime = performance.now()
    const { error: transferError } = await supabase
      .from('oc_inventory')
      .update({
        oc_id: matchedRecipient.id,
        received_at: new Date().toISOString(),
        gifted_by: ocId,
      })
      .eq('oc_id', ocId)
      .eq('item_id', matchedItem.item_id)
    const transferDuration = performance.now() - transferStartTime

    if (transferError) {
      chatLogger.error('Item transfer failed', transferError, {
        ocId,
        recipientOcId: matchedRecipient.id,
        itemId: matchedItem.item_id
      })
      throw transferError
    }

    dbLogger.debug('Item transferred successfully', {
      itemId: matchedItem.item_id,
      fromOcId: ocId,
      toOcId: matchedRecipient.id,
      transferDuration: Math.round(transferDuration)
    })

    // Side effect 1: Update sender's memory
    await supabase.from('memories').insert({
      oc_id: ocId,
      content: `我把${matchedItem.oc_items.name}送给了${matchedRecipient.name}。`,
      importance: 6,
    })

    // Side effect 2: Update recipient's memory
    const itemEmoji = matchedItem.oc_items.emoji || ''
    await supabase.from('memories').insert({
      oc_id: matchedRecipient.id,
      content: `${senderOC.name}送了我一个${matchedItem.oc_items.name}（${itemEmoji}）。`,
      importance: 7,
    })

    // Side effect 3: Update both OCs' relationship
    // Check if relationship exists
    const { data: existingRelationship } = await supabase
      .from('relationships')
      .select('*')
      .or(`and(oc_id_1.eq.${ocId},oc_id_2.eq.${matchedRecipient.id}),and(oc_id_1.eq.${matchedRecipient.id},oc_id_2.eq.${ocId})`)
      .limit(1)
      .single()

    const giftScoreIncrease = 15 // Giving a gift increases relationship

    if (existingRelationship) {
      const newScore = Math.min(100, existingRelationship.relationship_score + giftScoreIncrease)
      await supabase
        .from('relationships')
        .update({
          relationship_score: newScore,
          relationship_type: newScore > 30 ? 'friendly' : existingRelationship.relationship_type,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingRelationship.id)
    } else {
      const [id1, id2] = [ocId, matchedRecipient.id].sort()
      await supabase.from('relationships').insert({
        oc_id_1: id1,
        oc_id_2: id2,
        relationship_score: giftScoreIncrease,
        relationship_type: 'friendly',
      })
    }

    // Log world event
    await supabase.from('world_events').insert({
      event_type: 'item_gifted',
      description: `${senderOC.name} 把 ${matchedItem.oc_items.name} 送给了 ${matchedRecipient.name}`,
      metadata: {
        from_oc: ocId,
        to_oc: matchedRecipient.id,
        item_id: matchedItem.item_id,
        item_name: matchedItem.oc_items.name,
      },
    })

    const totalDuration = performance.now() - startTime
    chatLogger.info('gift_item (by name) tool completed', {
      ocId,
      recipientOcId: matchedRecipient.id,
      itemName: matchedItem.oc_items.name,
      recipientName: matchedRecipient.name,
      totalDuration: Math.round(totalDuration)
    })

    return {
      success: true,
      result: `你把 ${matchedItem.oc_items.name} 送给了 ${matchedRecipient.name}。这份礼物会增进你们的友谊。`,
    }
  } catch (error) {
    const totalDuration = performance.now() - startTime
    chatLogger.error('gift_item (by name) tool error', error as Error, {
      ocId,
      itemName: params.item_name,
      recipientName: params.recipient_name,
      totalDuration: Math.round(totalDuration)
    })
    return {
      success: false,
      result: '赠送物品失败，请重试。',
    }
  }
}
