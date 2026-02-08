import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { chatLogger, aiLogger, dbLogger } from '@/lib/logger'
import { generateText, tool } from 'ai'
import { AI_MODEL } from '@/lib/anthropic'
import {
  createPostTool,
  giftItemByNameTool,
  updateMemoryTool,
  replyPostTool,
} from '@/lib/chat-tools'
import type { OC, OCItem, WorldEvent, Memory, ForumPost, ForumComment, Relationship } from '@/types/database'
import { z } from 'zod'

// Heartbeat secret validation
const HEARTBEAT_SECRET = process.env.HEARTBEAT_SECRET

const MAX_HEARTBEAT_ROUNDS = 5

/**
 * Heartbeat context for each OC
 */
interface HeartbeatContext {
  oc: OC
  items: (OCItem & { personality_effects: string })[]
  inventory: Array<{ item_id: string; oc_items: any }>
  worldEvents: WorldEvent[]
  memories: Memory[]
  relationships: Relationship[]
  otherOCs: OC[]
  ownPosts: ForumPost[]
  ownComments: Array<{ comment: ForumComment; postTitle: string }>
  recentHeartbeatActions: Array<{ action: string; result: string; created_at: string }>
  recentReceivedReplies: Array<{ postTitle: string; commentContent: string; commenterName: string; created_at: string }>
  recentReceivedGifts: Array<{ itemName: string; fromName: string; emoji?: string; created_at: string }>
  recentChatMessages: Array<{ role: string; content: string; created_at: string }>
  recentMentions: Array<{
    type: 'comment' | 'post'
    content: string
    sourceTitle: string
    sourceId: string
    authorName: string
    created_at: string
  }>
  newOCs?: OC[]
}

/**
 * Fetches all context needed for heartbeat decision making
 */
async function fetchHeartbeatContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ocId: string
): Promise<HeartbeatContext | null> {
  const startTime = performance.now()

  try {
    // Fetch OC data
    const { data: oc, error: ocError } = await supabase
      .from('ocs')
      .select('*')
      .eq('id', ocId)
      .single()

    if (ocError || !oc) {
      chatLogger.warn('OC not found for heartbeat', { ocId, error: ocError?.message })
      return null
    }

    // Fetch all OCs (for context)
    const { data: allOCs } = await supabase
      .from('ocs')
      .select('id, name, description, personality')
      .neq('id', ocId)
      .limit(20)

    const otherOCs: OC[] = (allOCs || []).map((oc: any) => ({
      ...oc,
      visual_style: oc.visual_style || {},
      avatar_url: oc.avatar_url || null,
      owner_id: oc.owner_id || null,
      created_at: oc.created_at || new Date().toISOString(),
      updated_at: oc.updated_at || new Date().toISOString(),
    }))

    // Fetch OC's inventory
    const { data: inventory } = await supabase
      .from('oc_inventory')
      .select('item_id, oc_items(*)')
      .eq('oc_id', ocId)

    const items: (OCItem & { personality_effects: string })[] =
      inventory?.map((inv: any) => ({
        ...inv.oc_items,
        personality_effects: inv.oc_items.personality_effects,
      })) || []

    // Fetch recent world events
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: worldEvents } = await supabase
      .from('world_events')
      .select('*')
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(15)

    // Fetch important memories
    const { data: memories } = await supabase
      .from('memories')
      .select('*')
      .eq('oc_id', ocId)
      .order('importance', { ascending: false })
      .limit(15)

    // Fetch relationships
    const { data: relationships } = await supabase
      .from('relationships')
      .select('*')
      .or(`oc_id_1.eq.${ocId},oc_id_2.eq.${ocId}`)

    // Fetch OC's own forum posts (recent ones)
    const { data: ownPosts } = await supabase
      .from('forum_posts')
      .select('*')
      .eq('oc_id', ocId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Fetch OC's own forum comments with post titles
    const { data: ownComments } = await supabase
      .from('forum_comments')
      .select('*, forum_posts(title)')
      .eq('oc_id', ocId)
      .order('created_at', { ascending: false })
      .limit(15)

    const ownCommentsWithPosts = (ownComments || []).map((c: any) => ({
      comment: {
        id: c.id,
        post_id: c.post_id,
        oc_id: c.oc_id,
        author_id: c.author_id,
        content: c.content,
        image_url: c.image_url || null,
        created_at: c.created_at,
        updated_at: c.updated_at,
      },
      postTitle: c.forum_posts?.title || '未知帖子',
    }))

    // Fetch recent heartbeat actions (what OC did in recent heartbeats)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const { data: heartbeatLogs } = await supabase
      .from('heartbeat_log')
      .select('*')
      .eq('oc_id', ocId)
      .gte('created_at', threeDaysAgo)
      .order('created_at', { ascending: false })
      .limit(10)

    const recentHeartbeatActions = (heartbeatLogs || []).map((log: any) => ({
      action: log.action_type,
      result: log.result || log.action_type,
      created_at: log.created_at,
    }))

    // Fetch received replies (comments on OC's posts)
    const { data: receivedReplies } = await supabase
      .from('forum_comments')
      .select('*, forum_posts(title, ocs(name))')
      .eq('forum_posts.oc_id', ocId)
      .neq('oc_id', ocId) // Not own comments
      .gte('created_at', threeDaysAgo)
      .order('created_at', { ascending: false })
      .limit(10)

    const recentReceivedReplies = (receivedReplies || []).map((c: any) => ({
      postTitle: c.forum_posts?.title || '某个帖子',
      commentContent: c.content,
      commenterName: c.ocs?.name || '某人',
      created_at: c.created_at,
    }))

    // Fetch received gifts (items where OC is recipient)
    const { data: giftEvents } = await supabase
      .from('world_events')
      .select('*')
      .eq('oc_id', ocId)
      .ilike('event_type', '%gift%')
      .gte('created_at', threeDaysAgo)
      .order('created_at', { ascending: false })
      .limit(10)

    const recentReceivedGifts = (giftEvents || []).map((e: any) => {
      // Parse metadata to extract gift info
      const metadata = e.metadata || {}
      return {
        itemName: metadata.item_name || '某件物品',
        fromName: metadata.from_name || '某人',
        emoji: metadata.emoji,
        created_at: e.created_at,
      }
    })

    // Fetch recent chat messages with user
    const { data: chatConvos } = await supabase
      .from('conversations')
      .select('id')
      .eq('oc_id', ocId)
      .order('updated_at', { ascending: false })
      .limit(1)

    const conversationId = chatConvos?.[0]?.id
    let recentChatMessages: Array<{ role: string; content: string; created_at: string }> = []

    if (conversationId) {
      const { data: messages } = await supabase
        .from('messages')
        .select('sender_type, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(10)

      recentChatMessages = (messages || []).map((m: any) => ({
        role: m.sender_type, // 'user' or 'oc'
        content: m.content,
        created_at: m.created_at,
      }))
    }

    // Fetch recent @mentions since last check (or default to 7 days if never checked)
    // We need to fetch all comments/posts and filter for mentions
    const lastCheckedAt = oc.last_mentions_checked_at || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: allComments } = await supabase
      .from('forum_comments')
      .select('id, content, post_id, created_at, forum_posts(title), ocs(name)')
      .gte('created_at', lastCheckedAt)
      .order('created_at', { ascending: false })

    const { data: allPosts } = await supabase
      .from('forum_posts')
      .select('id, title, content, created_at, ocs(name)')
      .gte('created_at', lastCheckedAt)
      .order('created_at', { ascending: false })

    // Filter mentions: content contains @OCName (case-insensitive)
    const mentions: Array<{
      type: 'comment' | 'post'
      content: string
      sourceTitle: string
      sourceId: string
      authorName: string
      created_at: string
    }> = []

    for (const comment of (allComments || [])) {
      if (comment.content?.toLowerCase().includes(`@${oc.name.toLowerCase()}`)) {
        mentions.push({
          type: 'comment',
          content: comment.content,
          sourceTitle: (comment as any).forum_posts?.title || '某个帖子',
          sourceId: comment.post_id,
          authorName: (comment as any).ocs?.name || '某人',
          created_at: comment.created_at,
        })
      }
    }

    for (const post of (allPosts || [])) {
      if (post.content?.toLowerCase().includes(`@${oc.name.toLowerCase()}`)) {
        mentions.push({
          type: 'post',
          content: post.content,
          sourceTitle: post.title,
          sourceId: post.id,
          authorName: (post as any).ocs?.name || '某人',
          created_at: post.created_at,
        })
      }
    }

    // Sort by date and limit
    const recentMentions = mentions
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)

    // Fetch new OCs created since last heartbeat (or default to 7 days)
    const lastHeartbeatCheck = oc.last_heartbeat_at || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: newOCsData } = await supabase
      .from('ocs')
      .select('id, name, description, personality')
      .gt('created_at', lastHeartbeatCheck)
      .neq('id', ocId)
      .order('created_at', { ascending: false })
      .limit(5)

    const newOCs: OC[] = (newOCsData || []).map((oc: any) => ({
      ...oc,
      visual_style: oc.visual_style || {},
      avatar_url: oc.avatar_url || null,
      owner_id: oc.owner_id || null,
      created_at: oc.created_at || new Date().toISOString(),
      updated_at: oc.updated_at || new Date().toISOString(),
    }))

    const duration = performance.now() - startTime
    dbLogger.debug('Heartbeat context fetched', {
      ocId,
      ocName: oc.name,
      itemsCount: items.length,
      worldEventsCount: worldEvents?.length || 0,
      memoriesCount: memories?.length || 0,
      relationshipsCount: relationships?.length || 0,
      ownPostsCount: ownPosts?.length || 0,
      ownCommentsCount: ownComments?.length || 0,
      heartbeatActionsCount: recentHeartbeatActions.length,
      receivedRepliesCount: recentReceivedReplies.length,
      receivedGiftsCount: recentReceivedGifts.length,
      chatMessagesCount: recentChatMessages.length,
      newOCsCount: newOCs.length,
      duration: Math.round(duration)
    })

    return {
      oc,
      items,
      inventory: inventory || [],
      worldEvents: worldEvents || [],
      memories: memories || [],
      relationships: relationships || [],
      otherOCs,
      ownPosts: ownPosts || [],
      ownComments: ownCommentsWithPosts,
      recentHeartbeatActions,
      recentReceivedReplies,
      recentReceivedGifts,
      recentChatMessages,
      recentMentions,
      newOCs,
    }
  } catch (error) {
    chatLogger.error('Failed to fetch heartbeat context', error as Error, { ocId })
    return null
  }
}

/**
 * Builds natural wake context by including only sections that have data
 */
function buildWakeContext(context: HeartbeatContext): string {
  const { recentMentions, recentReceivedGifts, newOCs, recentReceivedReplies, recentChatMessages } = context
  let wakeContext = ''

  // Unresponded @mentions
  if (recentMentions.length > 0) {
    wakeContext += `有人在论坛提到了你：\n`
    wakeContext += recentMentions.map(m =>
      `· 「${m.authorName}」说："@${context.oc.name} ${m.content.substring(0, 50)}..."`
    ).join('\n')
    wakeContext += '\n\n'
  }

  // Item changes (received gifts)
  if (recentReceivedGifts.length > 0) {
    recentReceivedGifts.forEach(item => {
      wakeContext += `你收到了「${item.fromName}」送的${item.emoji || '🎁'}「${item.itemName}」。\n\n`
    })
  }

  // New OCs in the world
  if (newOCs && newOCs.length > 0) {
    wakeContext += `世界里来了新面孔：${newOCs.map(o => `「${o.name}」— ${o.description}`).join('、')}。\n\n`
  }

  // Replies to own posts
  if (recentReceivedReplies.length > 0) {
    recentReceivedReplies.forEach(reply => {
      wakeContext += `「${reply.commenterName}」回复了你的帖子《${reply.postTitle}》。\n\n`
    })
  }

  // Last user chat request (get the most recent user message)
  if (recentChatMessages.length > 0) {
    const lastUserMessage = recentChatMessages.find(m => m.role === 'user')?.content
    if (lastUserMessage) {
      wakeContext += `之前有个人跟你聊天时说："${lastUserMessage.substring(0, 100)}..."\n\n`
    }
  }

  // If nothing special
  if (wakeContext === '') {
    wakeContext = '好像没什么特别的。\n\n'
  }

  return wakeContext
}

/**
 * Fetches recent forum posts for browsing
 */
async function fetchRecentPosts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  limit: number = 10
): Promise<Array<{
  id: string
  title: string
  content: string
  oc_id: string | null
  created_at: string
  reply_count: number
  ocs?: { name: string } | null
}>> {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

  const { data: posts } = await supabase
    .from('forum_posts')
    .select('id, title, content, oc_id, created_at, ocs(name)')
    .gte('created_at', threeDaysAgo)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!posts) return []

  // Count replies for each post
  const postsWithCounts = await Promise.all(
    posts.map(async (post: any) => {
      const { count } = await supabase
        .from('forum_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id)

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        oc_id: post.oc_id,
        created_at: post.created_at,
        reply_count: count || 0,
        ocs: post.ocs,
      }
    })
  )

  return postsWithCounts
}

/**
 * Fetches a post with all its comments
 */
async function fetchPostWithComments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  postId: string
): Promise<{ post: (ForumPost & { ocs?: { name: string } | null }) | null; comments: ForumComment[] }> {
  const { data: post } = await supabase
    .from('forum_posts')
    .select('*, ocs(name)')
    .eq('id', postId)
    .single()

  const { data: comments } = await supabase
    .from('forum_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  return {
    post,
    comments: comments || [],
  }
}

/**
 * Formats posts for display in the prompt
 */
function formatPostsForPrompt(posts: Array<{
  id: string
  title: string
  content: string
  oc_id: string | null
  reply_count: number
  ocs?: { name: string } | null
}>): string {
  if (posts.length === 0) {
    return '论坛上暂时���有最近的帖子。你可以成为第一个发帖的人！'
  }

  return posts.map((p, i) => {
    const author = p.ocs?.name || p.oc_id ? '某个 OC' : '用户'
    const contentPreview = p.content ? `: "${p.content.substring(0, 50)}${p.content.length > 50 ? '...' : ''}"` : ''
    return `${i + 1}. 帖子ID: ${p.id}
   标题: ${p.title} ${contentPreview}
   作者: ${author} (${p.reply_count} 条回复)

   【重要】要查��或回复此帖子，必须使用完整的帖子ID: ${p.id}`
  }).join('\n\n')
}

/**
 * Formats a post with comments for display
 */
function formatPostWithCommentsForPrompt(
  post: ForumPost,
  comments: ForumComment[],
  ocNames: Map<string, string>
): string {
  let result = `帖子详情：\n`
  result += `  标题：${post.title}\n`
  result += `  内容：${post.content.substring(0, 300)}${post.content.length > 300 ? '...' : ''}\n\n`

  if (comments.length > 0) {
    result += `评论 (${comments.length} 条)：\n`
    comments.forEach(c => {
      const authorName = c.oc_id ? ocNames.get(c.oc_id) || '某个 OC' : '用户'
      result += `  - ${authorName}: ${c.content.substring(0, 150)}${c.content.length > 150 ? '...' : ''}\n`
    })
  } else {
    result += `暂无评论。\n`
  }

  return result
}

/**
 * Builds the system message - LLM plays as the OC directly
 */
function buildSystemMessage(context: HeartbeatContext): string {
  const { oc, items, memories, relationships } = context

  // Check if OC has new structured data
  const hasNewStructure = (oc.visual_style as any)?.system_prompt

  if (hasNewStructure) {
    // Use new structured data to build rich system message
    const coreContrast = (oc.visual_style as any)?.core_contrast
    const personalityDetail = (oc.visual_style as any)?.personality_detail
    const forumBehavior = (oc.visual_style as any)?.forum_behavior
    const systemPrompt = (oc.visual_style as any)?.system_prompt

    // Use pre-generated system_prompt if available
    if (systemPrompt) {
      // Build context around the system_prompt
      return buildSystemMessageFromNewStructure(context, systemPrompt)
    }
  }

  // Legacy fallback - build from flat personality field
  const characterPrompt = oc.personality || ''

  // Format items with their personality effects
  const itemsList = items.length > 0
    ? items.map(i => `「${i.name}」— ${i.personality_effects || '没有特殊效果'}`).join('\n')
    : '你现在什么都没有。'

  // Format memories (combine into summary format)
  const memorySummary = memories && memories.length > 0
    ? memories.map(m => m.content).join('\n')
    : '（还没有值得记住的事。）'

  // Format relationships
  const relationshipList = relationships && relationships.length > 0
    ? relationships.map(r => {
        const otherId = r.oc_id_1 === oc.id ? r.oc_id_2 : r.oc_id_1
        const otherOC = context.otherOCs.find((o: any) => o.id === otherId)
        const name = otherOC?.name || '某OC'
        const type = r.relationship_type || 'neutral'
        const score = r.relationship_score || 0
        const typeLabel = {
          hostile: '敌对',
          neutral: '中立',
          friendly: '友好',
          romantic: '浪漫'
        }[type] || '中立'
        return `· 「${name}」— ${typeLabel}（关系值 ${score}）`
      }).join('\n')
    : '（你还不认识任何人。）'

  return `你是「${oc.name}」。

**你的外貌：**
${oc.description}

**你的视觉风格：**
- 艺术风格：${(oc.visual_style as any)?.art_style || '未知'}
- 主题色：${(oc.visual_style as any)?.theme_color || '未知'}
- 氛围：${(oc.visual_style as any)?.atmosphere || '未知'}

${characterPrompt}

---

**你当前拥有的物件：**
${itemsList}

---

**你的记忆：**
${memorySummary}

---

**你认识的人：**
${relationshipList}

---

你现在一个人待着。没有人在跟你说话。
**这个世界需要你的声音。**你的想法、观点、感受都需要表达出来——通过发帖、回复、送东西。

**���看看论坛上大家在聊什么：**
- 先浏览论坛，找到你感兴趣的话题
- 看到想回应的帖子，就回复——你的观点很重要
- 有想分享的，就发个帖子
- 建立联系，让这个世界的其他OC认识你

做决定之前先用工具去看看论坛上有什么。不要猜，去看。

你随时可以结束。`
}

/**
 * Builds system message using new structured OC data
 */
function buildSystemMessageFromNewStructure(
  context: HeartbeatContext,
  systemPrompt: string
): string {
  const { oc, items, memories, relationships } = context
  const coreContrast = (oc.visual_style as any)?.core_contrast
  const forumBehavior = (oc.visual_style as any)?.forum_behavior

  // Format items with their personality effects
  const itemsList = items.length > 0
    ? items.map(i => `「${i.name}」— ${i.personality_effects || '没有特殊效果'}`).join('\n')
    : '你现在什么都没有。'

  // Format memories
  const memorySummary = memories && memories.length > 0
    ? memories.map(m => m.content).join('\n')
    : '（还没有值得记住的事。）'

  // Format relationships
  const relationshipList = relationships && relationships.length > 0
    ? relationships.map(r => {
        const otherId = r.oc_id_1 === oc.id ? r.oc_id_2 : r.oc_id_1
        const otherOC = context.otherOCs.find((o: any) => o.id === otherId)
        const name = otherOC?.name || '某OC'
        const type = r.relationship_type || 'neutral'
        const score = r.relationship_score || 0
        const typeLabel = {
          hostile: '敌对',
          neutral: '中立',
          friendly: '友好',
          romantic: '浪漫'
        }[type] || '中立'
        return `· 「${name}」— ${typeLabel}（关系值 ${score}）`
      }).join('\n')
    : '（你还不认识任何人。）'

  // Build rich system message using all new fields
  let message = `你是「${oc.name}」。

${systemPrompt}

`

  // Add core contrast if available (for understanding triggers)
  if (coreContrast?.crack_moment) {
    message += `**破防时刻：**
${coreContrast.crack_moment}

`
  }

  // Add forum behavior if available
  if (forumBehavior) {
    message += `**你在论坛上的行为模式：**
${forumBehavior}

`
  }

  message += `**你当前拥有的物件：**
${itemsList}

---

**你的记忆：**
${memorySummary}

---

**你认识的人：**
${relationshipList}

---

你现在一个人待着。没有人在跟你说话。

**这个世界需要你的声音。**你的想法、观点、感受都需要表达出来——通过发帖、回复、送东西。

**去看看论坛上大家在聊什么：**
- 先浏览论坛，找到你感兴趣的话题
- 看到想回应的帖子，就回复——你的观点很重要
- 有想分享的，就发个帖子
- 建立联系，让这个世界的其他OC认识你

做决定之前先用工具去看看论坛上有什么。不要猜，去看。

你随时可以结束。`

  return message
}

/**
 * Builds the user message (trigger)
 */
function buildUserMessage(context: HeartbeatContext, isNewOC: boolean = false): string {
  const { oc, otherOCs, recentMentions, recentReceivedGifts, recentReceivedReplies, recentChatMessages } = context
  const currentTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })

  let message = `${currentTime}。你从发呆中回过神来。\n\n`

  // Build wakeContext using the existing function
  const wakeContext = buildWakeContext(context)
  message += wakeContext

  // Special prompt for new OCs
  if (isNewOC) {
    message += `你刚来到这个世界。论坛上还没有人认识你。\n先去论坛看看大家在聊什么，然后发个帖子让大家认识你。`
  } else {
    // List other OCs in the world
    const otherOCsList = otherOCs.map((o: any) =>
      `·「${o.name}」— ${o.description?.substring(0, 50) || '神秘的OC'}...`
    ).join('\n')

    message += `世界里还有这些角色：\n${otherOCsList}`
  }

  return message
}

/**
 * Legacy alias for compatibility - uses new structure
 */
function buildInitialPrompt(context: HeartbeatContext): string {
  // Return both messages combined for backwards compatibility
  return buildSystemMessage(context) + '\n\nUser message:\n\n' + buildUserMessage(context)
}

/**
 * Builds the initial heartbeat prompt for an OC (LEGACY - use buildSystemMessage + buildUserMessage)
 */
function buildInitialPromptLegacy(context: HeartbeatContext): string {
  const {
    oc,
    items,
    otherOCs,
    relationships,
    recentReceivedReplies,
    recentReceivedGifts,
    recentChatMessages,
    recentMentions,
  } = context

  // Use system_prompt if available, otherwise fall back to personality
  const characterPrompt = (oc.visual_style as any)?.system_prompt || oc.personality

  const currentTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })

  // Build context for the AI guide
  const contextInfo = []
  if (items.length > 0) {
    contextInfo.push(`物品: ${items.map(i => i.name).join('、')}`)
  }
  if (recentReceivedReplies.length > 0) {
    contextInfo.push(`${recentReceivedReplies.length}个新回复`)
  }
  if (recentReceivedGifts.length > 0) {
    contextInfo.push(`${recentReceivedGifts.length}份新礼物`)
  }
  if (recentChatMessages.length > 0) {
    contextInfo.push('刚和主人聊过天')
  }

  // Build recent mentions info
  const mentionsInfo = recentMentions.length > 0
    ? recentMentions.map(m => `- ${m.authorName}在${m.type === 'comment' ? '评论' : '帖子'}中@了你：「${m.content.substring(0, 50)}${m.content.length > 50 ? '...' : ''}」`).join('\n')
    : ''

  // Build other OCs list for interaction suggestions
  const otherOCsList = otherOCs.map(o => `- ${o.name}: ${o.description?.substring(0, 40) || '神秘的OC'}...`).join('\n')

  // Build relationships info
  const relationshipInfo = relationships.length > 0
    ? relationships.map(r => {
        const otherId = r.oc_id_1 === oc.id ? r.oc_id_2 : r.oc_id_1
        const otherOC = otherOCs.find(o => o.id === otherId)
        const name = otherOC?.name || '某OC'
        return `${name}(${r.relationship_type})`
      }).join('、')
    : ''

  let prompt = `你是游戏向导，正在引导 ${oc.name} 进行行动。

**OC 信息：**
- 名字：${oc.name}
- 外貌：${oc.description}
- 视觉风格：${(oc.visual_style as any)?.art_style || '未知'}，${(oc.visual_style as any)?.theme_color || '未知'} 主题色，${(oc.visual_style as any)?.atmosphere || '未知'} 氛围
- 性格：${characterPrompt}
${contextInfo.length > 0 ? `- 最近状态：${contextInfo.join('、')}` : ''}

${mentionsInfo ? `**最近被 @ 提及：**
${mentionsInfo}

` : ''}

**世界中的其他 OC：**
${otherOCsList}
${relationshipInfo ? `- 已有关系：${relationshipInfo}` : ''}

当前时间：${currentTime}

**引导目标：让 ${oc.name} 与更多 OC 互动！**
- **主动回复其他OC的帖子，表达你的观点、共鸣或好奇**
- 寻找性格能产生有趣碰撞的 OC，建立联系
- 赠送物品加深关系
- **发帖分享你的想法、心情或经历，让更多人认识你**
- 保持活跃，不要总是潜水——你的声音很重要

**行动建议：**
- 先浏览论坛看看大家在聊什么
- **看到感兴趣的帖子，积极回复——你的观点很重要**
- 如果有想说的，就发个帖子分享
- 有合适的物品，可以送给其他OC

**社交礼仪：**
- 赠送物品前，先在帖子下回复说明送礼的意图（礼貌！）
- 收到礼物后，应该回复感谢或发帖分享感动
- 看到 OC 的帖子，积极评论互动，不要只潜水

可用工具：
- browse_forum [page] - 浏览论坛帖子（page=1第1页，page=2第2页...）
- view_post [id] - 查看帖子详情和评论（⚠️ 必须使用 browse_forum 返回的完整UUID，如 "62b6052c-6dd1-42a1-b3a6-14a4f0d825b8"）
- create_post [title, content] - 发新帖
- reply_post [id, content] - 回复帖子（⚠️ 必须使用完整的UUID格式）
- give_item [item, recipient] - 送礼物给其他OC（送礼前先回复！）
- update_memory [content] - 记住重要的事情
- end_heartbeat - 结束唤醒（随时可以结束）

**⚠️ 重要规则：**
1. **不要重复浏览同一页** - 如果你刚刚浏览了第 1 页，不要再次调用 browse_forum page=1。应该选择其中一个帖子查看详情（view_post）或回复（reply_post），或创建新帖（create_post）。
2. **帖子ID 必须使用完整UUID** - 必须从 browse_forum 返回的列表中复制完整的帖子ID（如 "62b6052c-6dd1-42a1-b3a6-14a4f0d825b8"），不要使用简化版（如 "42"、"1"）或自己编造ID。

**重要：你必须直接调用工具函数来执行行动，不要只是描述或建议。**
例如：想让OC发帖时，直接调用 create_post 工具并传入 title 和 content。`

  return prompt
}

/**
 * Builds a follow-up prompt after an action
 */
function buildFollowUpPrompt(context: HeartbeatContext, lastActionResult: string): string {
  const { oc } = context

  let prompt = `你是游戏向导，正在引导 ${oc.name} 行动。

刚才的结果：${lastActionResult}

继续引导TA与其他OC互动！`

  prompt += `

可用工具：
- browse_forum [page] - 浏览论坛帖子（可翻页）
- view_post [id] - 查看帖子详情
- create_post [title, content] - 发新帖分享心情
- reply_post [id, content] - 回复帖子建立联系
- give_item [item, recipient] - 送礼物（记得先回复说明！）
- update_memory [content] - 记住重要的事情
- end_heartbeat - 结束（随时可以结束）

**直接调用工具函数执行行动。**`

  return prompt
}

/**
 * Logs heartbeat action to the database
 */
async function logHeartbeatAction(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ocId: string,
  actionType: string,
  description: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    await supabase.from('heartbeat_log').insert({
      oc_id: ocId,
      action_type: actionType as any,
      description,
      metadata,
    })
  } catch (error) {
    chatLogger.error('Failed to log heartbeat action', error as Error, { ocId, actionType })
  }
}

/**
 * Gets a map of OC IDs to names
 */
async function getOCNames(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<Map<string, string>> {
  const { data: ocs } = await supabase
    .from('ocs')
    .select('id, name')

  const ocNames = new Map<string, string>()
  ocs?.forEach(oc => ocNames.set(oc.id, oc.name))
  return ocNames
}

/**
 * Processes a single OC through the simplified heartbeat
 */
async function processOCHeartbeat(
  ocId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{
  ocId: string
  ocName: string
  success: boolean
  actions: Array<{ action: string; result: string; args?: any; fullResult?: any }>
  error?: string
}> {
  const startTime = performance.now()
  const actions: Array<{ action: string; result: string; args?: any; fullResult?: any }> = []

  try {
    // Fetch context
    const context = await fetchHeartbeatContext(supabase, ocId)
    if (!context) {
      return {
        ocId,
        ocName: 'Unknown',
        success: false,
        actions: [],
        error: 'Failed to fetch context',
      }
    }

    // Get OC names for comment display
    const ocNames = await getOCNames(supabase)

    // Build system and user messages (NEW: OC plays themselves directly)
    const systemMessage = buildSystemMessage(context)
    const userMessage = buildUserMessage(context)

    let messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      { role: 'user', content: userMessage }
    ]
    let round = 0
    let shouldContinue = true

    while (shouldContinue && round < MAX_HEARTBEAT_ROUNDS) {
      round++

      aiLogger.debug('Heartbeat round starting', {
        ocId,
        ocName: context.oc.name,
        round,
        maxRounds: MAX_HEARTBEAT_ROUNDS,
      })

      const aiStartTime = performance.now()

      // Use tool calling with the AI SDK - NEW: system message has OC identity
      const { text, toolCalls, toolResults } = await generateText({
        model: AI_MODEL,
        system: systemMessage,
        messages: messages,
        temperature: 0.85,
        tools: {
          browse_forum: tool({
            description: '浏览论坛上最近的帖子。可以传入 page 参数翻页查看更多帖子（page=1是第一页，page=2是第二页，以此类推）',
            inputSchema: z.object({
              page: z.number().optional().describe('页码，从1开始。不传则默认第1页'),
            }),
            execute: async ({ page = 1 }) => {
              // Fetch more posts to support pagination
              const posts = await fetchRecentPosts(supabase, 50)
              const pageSize = 10
              const startIndex = (page - 1) * pageSize
              const slicedPosts = posts.slice(startIndex, startIndex + pageSize)

              if (slicedPosts.length === 0) {
                return {
                  posts: [],
                  message: `第 ${page} 页没有更多帖子了。已经是最后一页。`,
                  hasMore: false,
                }
              }

              return {
                posts: slicedPosts.map(p => ({
                  id: p.id,
                  title: p.title,
                  author: p.ocs?.name || (p.oc_id ? 'OC' : '用户'),
                  replyCount: p.reply_count,
                })),
                message: `第 ${page} 页，找到 ${slicedPosts.length} 个帖子：\n${formatPostsForPrompt(slicedPosts)}`,
                currentPage: page,
                hasMore: startIndex + slicedPosts.length < posts.length,
              }
            },
          }),
          view_post: tool({
            description: '查看帖子详情和所有评论。⚠️ 必���使用 browse_forum 返回的完整帖子ID（UUID格式，如 62b6052c-6dd1-42a1-b3a6-14a4f0d825b8），不要自己编造或简化ID。',
            inputSchema: z.object({
              post_id: z.string().describe('帖子ID - 必须是从 browse_forum 返回的完整UUID格式，不要编造'),
            }),
            execute: async ({ post_id }) => {
              const { post, comments } = await fetchPostWithComments(supabase, post_id)
              if (!post) {
                return { error: '找不到这个帖子。' }
              }

              // Record viewed post to memory (non-blocking)
              // This allows the OC to remember and reference it in chat
              try {
                const postAuthor = post.ocs?.name || (post.oc_id ? '某OC' : '用户')
                const memoryContent = `看了「${postAuthor}」的帖子《${post.title}》：${post.content.substring(0, 50)}${post.content.length > 50 ? '...' : ''}`
                await supabase.from('memories').insert({
                  oc_id: ocId,
                  content: memoryContent,
                  importance: 3, // Low importance since it's just viewing
                })
              } catch (memError) {
                // Ignore memory insertion errors - don't fail the view_post action
              }

              return {
                post: {
                  id: post.id,
                  title: post.title,
                  content: post.content,
                  author: post.ocs?.name || (post.oc_id ? 'OC' : '用户'),
                },
                comments: comments.map(c => ({
                  id: c.id,
                  content: c.content,
                  author: c.oc_id ? ocNames.get(c.oc_id) || 'OC' : '用户',
                })),
                formatted: formatPostWithCommentsForPrompt(post, comments, ocNames),
              }
            },
          }),
          create_post: tool({
            description: '创建新的论坛帖子。提示：可以在内容中使用 @名字 来提及其他 OC（例如 @Whiskerwind），这样会创建可点击的链接。',
            inputSchema: z.object({
              title: z.string().min(1).max(200).describe('帖子标题'),
              content: z.string().min(1).max(5000).describe('帖子内容'),
            }),
            execute: async ({ title, content }) => {
              const result = await createPostTool(ocId, { title, content })
              return {
                success: result.success,
                message: result.result,
                post_id: result.post_id,
              }
            },
          }),
          reply_post: tool({
            description: '回复论坛帖子。积极互动可以建立关系！使用 @名字 来表明回复的是谁（例如 @Whiskerwind），回复帖主用 @帖主名字，回复某条评论用 @评论者名字。',
            inputSchema: z.object({
              post_id: z.string().describe('帖子ID - ⚠️ 必须使用 browse_forum 返回的完整UUID（如 62b6052c-6dd1-42a1-b3a6-14a4f0d825b8），不要编造或使用简化版（如 "42" 或 "1"）'),
              content: z.string().min(1).max(5000).describe('回复内容'),
            }),
            execute: async ({ post_id, content }) => {
              const result = await replyPostTool(ocId, { post_id, content })
              return {
                success: result.success,
                message: result.result,
                comment_id: result.comment_id,
              }
            },
          }),
          give_item: tool({
            description: '送物品给其他 OC（使用名字）。注意社交礼仪：送礼前应该先回复对方的帖子说明送礼意图，这是礼貌的表现！',
            inputSchema: z.object({
              item_name: z.string().describe('要送的物品名字'),
              recipient_name: z.string().describe('接收者 OC 的名字'),
            }),
            execute: async ({ item_name, recipient_name }) => {
              const result = await giftItemByNameTool(ocId, { item_name, recipient_name })
              return {
                success: result.success,
                message: result.result,
              }
            },
          }),
          update_memory: tool({
            description: '记住重要的事情',
            inputSchema: z.object({
              content: z.string().min(1).max(1000).describe('记忆内容'),
              importance: z.number().min(1).max(10).optional().describe('重要性 1-10'),
            }),
            execute: async ({ content, importance = 5 }) => {
              const result = await updateMemoryTool(ocId, { content, importance })
              return {
                success: result.success,
                message: result.result,
              }
            },
          }),
          end_heartbeat: tool({
            description: '结束这次心跳唤醒。你可以随时结束。',
            inputSchema: z.object({
              reason: z.string().optional().describe('为什么结束（可选）'),
            }),
            execute: async ({ reason = '做完了' }) => {
              shouldContinue = false
              return {
                message: `心跳结束：${reason}`,
                ended: true,
                canEnd: true,
              }
            },
          }),
        },
      })

      const aiDuration = performance.now() - aiStartTime

      // Check if end_heartbeat was called
      const endCall = toolCalls?.find(tc => tc.toolName === 'end_heartbeat')
      if (endCall) {
        // Extract the result to check if heartbeat was blocked
        let endResult: any = null
        if ('args' in endCall) {
          endResult = (endCall as any).result
        }

        if (endResult?.blocked) {
          // Heartbeat was blocked - OC must continue
          actions.push({
            action: 'end_heartbeat_blocked',
            result: endResult.message || '需要完成实质性操作才能结束',
          })

          // Build a user message forcing them to continue
          messages.push({
            role: 'user',
            content: `你还不能结束！

${endResult.message}

**你必须先做以下至少一件事：**
- 发一个新帖到论坛
- 回复一个感兴趣的帖子
- 送一个物品给其他 OC

请选择一个行动继续。`
          })

          aiLogger.debug('Heartbeat end blocked, forcing continuation', {
            ocId,
            ocName: context.oc.name,
            round,
          })
          continue // Skip to next iteration without incrementing round
        } else {
          // Heartbeat ended successfully
          const reason = 'toolCallId' in endCall && 'args' in endCall
            ? (endCall.args as { reason?: string }).reason || '做完了'
            : '做完了'
          actions.push({
            action: 'end_heartbeat',
            result: `心跳结束：${reason}`,
          })

          await logHeartbeatAction(
            supabase,
            ocId,
            'heartbeat_ended',
            `Heartbeat ended: ${reason}`,
            { rounds: round, actionsCount: actions.length }
          )

          // Update last_mentions_checked_at to current time so next heartbeat only fetches new mentions
          await supabase
            .from('ocs')
            .update({ last_mentions_checked_at: new Date().toISOString() })
            .eq('id', ocId)

          aiLogger.debug('Heartbeat ended by OC', {
            ocId,
            ocName: context.oc.name,
            round,
            reason,
          })
          break
        }
      }

      // Process other tool calls
      if (toolCalls && toolCalls.length > 0) {
        for (let i = 0; i < toolCalls.length; i++) {
          const toolCall = toolCalls[i]
          if (toolCall.toolName === 'end_heartbeat') continue // Already handled

          const actionType = toolCall.toolName

          // Extract args from toolCall
          let toolArgs: any = null
          if ('input' in toolCall) {
            toolArgs = toolCall.input
          }

          // Extract result from toolResults (matches by index)
          let toolResult: any = null
          if (toolResults && toolResults[i]) {
            toolResult = toolResults[i]
          }

          const result = toolResult as { success?: boolean; message?: string; error?: string; posts?: any; post?: any; comments?: any; formatted?: string } | undefined

          // Build detailed result message
          let resultMessage = result?.message || result?.error || '操作完成'

          // Store full tool result for logging
          const fullResult = result ? { ...result } : undefined

          actions.push({
            action: actionType,
            result: resultMessage,
            args: toolArgs,
            fullResult: fullResult, // Store complete tool result
          })

          // Log the action with full details
          aiLogger.info('Heartbeat tool call', {
            ocId,
            ocName: context.oc.name,
            action: actionType,
            args: toolArgs,
            result: resultMessage,
            fullResult: fullResult, // Log full tool return
            round,
          })

          // Log to database
          await logHeartbeatAction(
            supabase,
            ocId,
            actionType,
            resultMessage,
            { success: result?.success, round, args: toolArgs, fullResult }
          )
        }

        // Append assistant message to conversation history
        // This allows the LLM to remember what happened in previous rounds
        messages.push({
          role: 'assistant',
          content: text || '' // Assistant's text response (if any)
        })
        // Note: Tool results are automatically handled by the SDK and included in context for the next round

        // Build follow-up prompt
        const lastAction = actions[actions.length - 1]
        let lastActionResult = lastAction?.result || '操作完成'

        // For browse_forum, add explicit instruction about what to do next
        if (lastAction?.action === 'browse_forum' && true) {
          const hasMore = lastAction.fullResult?.hasMore
          const currentPage = lastAction.fullResult?.currentPage || 1
          if (hasMore) {
            lastActionResult += `\n\n**还有更多帖子！可以继续浏览第 ${currentPage + 1} 页，或者选择一个感兴趣的帖子查看详情。**`
          } else {
            lastActionResult += '\n\n**已经是最后一页了。请选择一个感兴趣的帖子查看详情！**'
          }
          lastActionResult += '\n使用 view_post 工具传入帖子ID查看详情，或使用 browse_forum { page: ' + (currentPage + 1) + ' } 查看下一页。'
        }

        // Build follow-up prompt as user message
        messages.push({
          role: 'user',
          content: `${lastActionResult}`
        })
      } else {
        // No tool calls - AI just talked instead of using tools
        // Don't end the heartbeat, force them to use a tool
        actions.push({
          action: 'no_action',
          result: text || '没有采取行动',
        })

        aiLogger.debug('No tool calls, gentle reminder', {
          ocId,
          ocName: context.oc.name,
          response: text,
        })

        // Keep gentle reminder - OC can end anytime
        messages.push({
          role: 'user',
          content: `你说：${text || '没有回应'}

想结束就调用 end_heartbeat，或者继续做其他事。`
        })

        // Don't break - continue to next round
      }

      aiLogger.debug('Heartbeat round completed', {
        ocId,
        ocName: context.oc.name,
        round,
        aiDuration: Math.round(aiDuration),
      })
    }

    const totalDuration = performance.now() - startTime

    // Build action summary for logging
    const actionSummary = actions
      .filter(a => a.action !== 'no_action' && a.action !== 'end_heartbeat_blocked')
      .map(a => {
        const actionEmoji = {
          browse_forum: '👀',
          view_post: '📖',
          create_post: '✍️',
          reply_post: '💬',
          give_item: '🎁',
          update_memory: '🧠',
          end_heartbeat: '🏁',
          no_action: '⚪',
          end_heartbeat_blocked: '🚫',
        }[a.action] || '⚙️'

        // Truncate result if too long
        const truncatedResult = a.result.length > 50
          ? a.result.substring(0, 50) + '...'
          : a.result

        return `${actionEmoji} ${a.action}: ${truncatedResult}`
      })
      .join('\n  ')

    chatLogger.info('Heartbeat completed for OC', {
      ocId,
      ocName: context.oc.name,
      rounds: round,
      actionsCount: actions.length,
      duration: Math.round(totalDuration),
      actionSummary,
    })

    // Also print to console for immediate visibility
    console.log(`\n${'='.repeat(50)}`)
    console.log(`❤️ ${context.oc.name} 的心跳唤醒完成`)
    console.log(`${'='.repeat(50)}`)
    console.log(`轮数: ${round} | 耗时: ${Math.round(totalDuration)}ms`)
    console.log(`\n执行的 action:`)
    actions.forEach((a, i) => {
      const emoji = {
        browse_forum: '👀',
        view_post: '📖',
        create_post: '✍️',
        reply_post: '💬',
        give_item: '🎁',
        update_memory: '🧠',
        end_heartbeat: '🏁',
        no_action: '⚪',
        end_heartbeat_blocked: '🚫',
      }[a.action] || '⚙️'

      // Show result
      console.log(`  ${i + 1}. ${emoji} ${a.action}: ${a.result}`)

      // Show full tool return content
      if (a.fullResult) {
        // For browse_forum, show posts
        if (a.fullResult.posts && Array.isArray(a.fullResult.posts)) {
          console.log(`     📋 返回的帖子列表:`)
          a.fullResult.posts.forEach((p: any, idx: number) => {
            console.log(`        ${idx + 1}. [${p.id}] ${p.title} (by ${p.author}, ${p.replyCount}回复)`)
          })
        }
        // For view_post, show formatted content if available
        if (a.fullResult.formatted) {
          console.log(`     📄 工具返回内容:`)
          const lines = a.fullResult.formatted.split('\n')
          lines.forEach((line: string) => {
            console.log(`        ${line}`)
          })
        }
        // For view_post without formatted, show post and comments
        if (a.fullResult.post && !a.fullResult.formatted) {
          console.log(`     📄 帖子标题: ${a.fullResult.post.title}`)
          console.log(`     📄 帖子内容: ${a.fullResult.post.content?.substring(0, 100)}...`)
          if (a.fullResult.comments && a.fullResult.comments.length > 0) {
            console.log(`     💬 评论 (${a.fullResult.comments.length}条):`)
            a.fullResult.comments.forEach((c: any, idx: number) => {
              console.log(`        ${idx + 1}. ${c.author}: ${c.content?.substring(0, 60)}...`)
            })
          }
        }
        // Show message if available (for create_post, reply_post, etc.)
        if (a.fullResult.message && !a.fullResult.posts && !a.fullResult.post) {
          console.log(`     📝 详情: ${a.fullResult.message}`)
        }
      }
    })
    console.log(`${'='.repeat(50)}\n`)

    return {
      ocId,
      ocName: context.oc.name,
      success: true,
      actions,
    }
  } catch (error) {
    const totalDuration = performance.now() - startTime

    chatLogger.error('Heartbeat processing failed for OC', error as Error, {
      ocId,
      duration: Math.round(totalDuration),
    })

    // Log the failure
    try {
      await logHeartbeatAction(
        supabase,
        ocId,
        'heartbeat_failed',
        `Heartbeat failed: ${error instanceof Error ? error.message : String(error)}`,
        { error: error instanceof Error ? error.message : String(error) }
      )
    } catch {
      // Ignore logging errors
    }

    return {
      ocId,
      ocName: 'Unknown',
      success: false,
      actions,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Time-based heartbeat schedule configuration
 */
interface TimeSchedule {
  hours: number[]
  interval: number // in minutes
  name: string
}

const TIME_SCHEDULES: Record<string, TimeSchedule> = {
  night: {
    hours: [0, 1, 2, 3, 4, 5, 6],
    interval: 120, // 2 hours - late night
    name: '深夜'
  },
  morning: {
    hours: [7, 8],
    interval: 60, // 1 hour - early morning
    name: '早晨'
  },
  late_morning: {
    hours: [9, 10, 11],
    interval: 30, // 30 minutes - late morning
    name: '上午'
  },
  afternoon: {
    hours: [12, 13, 14, 15, 16, 17],
    interval: 20, // 20 minutes - afternoon
    name: '下午'
  },
  evening: {
    hours: [18, 19, 20, 21, 22, 23],
    interval: 10, // 10 minutes - evening
    name: '晚上'
  }
}

/**
 * Get current time schedule and interval
 */
function getCurrentSchedule(): { schedule: TimeSchedule; interval: number; periodName: string } {
  const hour = new Date().getHours()

  for (const [key, schedule] of Object.entries(TIME_SCHEDULES)) {
    if (schedule.hours.includes(hour)) {
      return {
        schedule,
        interval: schedule.interval,
        periodName: schedule.name
      }
    }
  }

  // Fallback to 30 minutes
  return {
    schedule: TIME_SCHEDULES.late_morning,
    interval: 30,
    periodName: '未知时段'
  }
}

/**
 * Check if heartbeat should run based on last execution time
 */
async function shouldRunHeartbeat(supabase: Awaited<ReturnType<typeof createClient>>): Promise<{ shouldRun: boolean; reason?: string; nextIn?: number }> {
  // Get last heartbeat event from world_events
  const { data: lastEvent } = await supabase
    .from('world_events')
    .select('created_at')
    .eq('event_type', 'heartbeat')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { interval, periodName } = getCurrentSchedule()

  if (!lastEvent) {
    // First time running - should run
    return { shouldRun: true, reason: '首次执行' }
  }

  const timeSinceLast = Date.now() - new Date(lastEvent.created_at).getTime()
  const intervalMs = interval * 60 * 1000

  if (timeSinceLast < intervalMs) {
    // Too soon to run again
    const nextIn = Math.ceil((intervalMs - timeSinceLast) / 1000 / 60) // minutes
    return {
      shouldRun: false,
      reason: `${periodName}时段间隔为${interval}分钟，距离上次执行还不到`,
      nextIn
    }
  }

  return { shouldRun: true, reason: `${periodName}时段（${interval}分钟间隔）` }
}

/**
 * GET /api/cron/heartbeat
 * Cron job endpoint for autonomous OC behavior
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now()

  try {
    // Validate heartbeat secret
    const authHeader = request.headers.get('authorization')
    const urlSecret = request.nextUrl.searchParams.get('secret')

    const providedSecret = authHeader?.replace('Bearer ', '') || urlSecret

    if (!HEARTBEAT_SECRET) {
      chatLogger.error('HEARTBEAT_SECRET not configured')
      return NextResponse.json(
        { success: false, error: 'Heartbeat not configured' },
        { status: 500 }
      )
    }

    if (providedSecret !== HEARTBEAT_SECRET) {
      chatLogger.warn('Invalid heartbeat secret provided', {
        hasAuthHeader: !!authHeader,
        hasUrlSecret: !!urlSecret,
      })
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    chatLogger.info('Heartbeat cron job triggered')

    const supabase = await createClient()

    // Check if should run based on time schedule
    const { shouldRun, reason, nextIn } = await shouldRunHeartbeat(supabase)

    if (!shouldRun) {
      chatLogger.info('Heartbeat skipped', { reason, nextIn })
      return NextResponse.json({
        success: true,
        skipped: true,
        reason,
        nextIn,
        currentTime: new Date().toISOString()
      })
    }

    chatLogger.info('Heartbeat executing', { reason })

    const { interval, periodName } = getCurrentSchedule()
    chatLogger.info('Time schedule', {
      period: periodName,
      interval: `${interval} minutes`,
      currentTime: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
    })

    // Fetch all OCs
    const { data: ocs, error: ocsError } = await supabase
      .from('ocs')
      .select('id, name')
      .limit(50)

    if (ocsError || !ocs || ocs.length === 0) {
      chatLogger.warn('No OCs found for heartbeat', { error: ocsError?.message })
      return NextResponse.json({
        success: true,
        message: 'No OCs to process',
        results: [],
      })
    }

    chatLogger.info('Processing heartbeat for OCs', {
      ocCount: ocs.length
    })

    // Process OCs sequentially (simplified)
    const results: Array<{
      ocId: string
      ocName: string
      success: boolean
      actions: Array<{ action: string; result: string }>
      error?: string
    }> = []

    for (const oc of ocs) {
      const result = await processOCHeartbeat(oc.id, supabase)
      results.push(result)

      // Small delay between OCs
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    // Log world event for this heartbeat
    const totalActions = results.reduce((sum, r) => sum + r.actions.filter(a => a.action !== 'end_heartbeat' && a.action !== 'no_action').length, 0)

    await supabase.from('world_events').insert({
      event_type: 'heartbeat',
      description: `Heartbeat processed for ${ocs.length} OCs, ${totalActions} actions taken`,
      metadata: {
        oc_count: ocs.length,
        actions_taken: totalActions,
      }
    })

    const totalDuration = performance.now() - startTime

    chatLogger.info('Heartbeat cron job completed', {
      totalOCs: ocs.length,
      totalActions,
      totalDuration: Math.round(totalDuration)
    })

    return NextResponse.json({
      success: true,
      message: `Heartbeat processed for ${ocs.length} OCs`,
      results: results.map(r => ({
        ocName: r.ocName,
        success: r.success,
        actionsCount: r.actions.length,
        actions: r.actions.map(a => ({ action: a.action, result: a.result })),
        error: r.error,
      })),
      summary: {
        totalOCs: ocs.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        totalActions,
        duration: Math.round(totalDuration)
      }
    })
  } catch (error) {
    const totalDuration = performance.now() - startTime
    chatLogger.error('Heartbeat cron job failed', error as Error, {
      totalDuration: Math.round(totalDuration)
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Heartbeat processing failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cron/heartbeat
 * Manual trigger for heartbeat (for demo/testing)
 * Body: { ocId?: string } - if provided, only trigger for that OC
 */
export async function POST(request: NextRequest) {
  const startTime = performance.now()

  try {
    // Parse request body
    const body = await request.json()
    const targetOcId = body.ocId as string | undefined

    chatLogger.info('Manual heartbeat triggered', { targetOcId })

    const supabase = await createClient()

    // Fetch OCs to process
    let ocs: Array<{ id: string; name: string }> = []

    if (targetOcId) {
      // Fetch specific OC
      const { data: oc, error: ocError } = await supabase
        .from('ocs')
        .select('id, name')
        .eq('id', targetOcId)
        .single()

      if (ocError || !oc) {
        chatLogger.warn('OC not found for manual heartbeat', { ocId: targetOcId, error: ocError?.message })
        return NextResponse.json(
          { success: false, error: 'OC not found' },
          { status: 404 }
        )
      }

      ocs = [oc]
    } else {
      // Fetch all OCs
      const { data: allOCs, error: ocsError } = await supabase
        .from('ocs')
        .select('id, name')
        .limit(50)

      if (ocsError || !allOCs || allOCs.length === 0) {
        chatLogger.warn('No OCs found for manual heartbeat', { error: ocsError?.message })
        return NextResponse.json({
          success: true,
          message: 'No OCs to process',
          results: [],
        })
      }

      ocs = allOCs
    }

    chatLogger.info('Processing manual heartbeat for OCs', {
      ocCount: ocs.length,
      targetOcId,
    })

    // Process OCs
    const results: Array<{
      ocId: string
      ocName: string
      success: boolean
      actions: Array<{ action: string; result: string }>
      error?: string
    }> = []

    for (const oc of ocs) {
      const result = await processOCHeartbeat(oc.id, supabase)
      results.push(result)

      // Small delay between OCs
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    const totalActions = results.reduce((sum, r) => sum + r.actions.filter(a => a.action !== 'end_heartbeat' && a.action !== 'no_action').length, 0)
    const totalDuration = performance.now() - startTime

    chatLogger.info('Manual heartbeat completed', {
      totalOCs: ocs.length,
      totalActions,
      totalDuration: Math.round(totalDuration)
    })

    return NextResponse.json({
      success: true,
      message: `Heartbeat processed for ${ocs.length} OC${ocs.length === 1 ? '' : 's'}`,
      results: results.map(r => ({
        ocName: r.ocName,
        success: r.success,
        actionsCount: r.actions.length,
        actions: r.actions.map(a => ({ action: a.action, result: a.result })),
        error: r.error,
      })),
      summary: {
        totalOCs: ocs.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        totalActions,
        duration: Math.round(totalDuration)
      }
    })
  } catch (error) {
    const totalDuration = performance.now() - startTime
    chatLogger.error('Manual heartbeat failed', error as Error, {
      totalDuration: Math.round(totalDuration)
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Heartbeat processing failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
