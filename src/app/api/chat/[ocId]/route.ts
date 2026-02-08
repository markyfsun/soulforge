import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { chatLogger, dbLogger, aiLogger } from '@/lib/logger'
import { streamText, tool } from 'ai'
import { AI_MODEL } from '@/lib/anthropic'
import { buildChatSystemPrompt, buildChatMessages } from '@/lib/chat-prompts'
import {
  updateMemoryTool,
  updateRelationshipByNameTool,
  createPostTool,
  replyPostTool,
  giftItemByNameTool,
} from '@/lib/chat-tools'
import { getRecentWorldEvents, formatWorldEventsForPrompt } from '@/lib/world-events'
import { z } from 'zod'
import type { OC, OCItem, WorldEvent, Memory, Message, Relationship, ForumPost, ForumComment } from '@/types/database'
import { convertToModelMessages, validateUIMessages, type UIMessage } from 'ai'

// Import session tracking utilities
import { getUserId, getSessionId } from '@/lib/analytics/session-tracker'
import { logger } from '@/lib/logger/logger'

// Extended relationship type with OC names
interface RelationshipWithNames extends Relationship {
  oc_1: { name: string }
  oc_2: { name: string }
}

// Chat context interface
interface ChatContext {
  oc: OC
  items: (OCItem & { personality_effects: string })[]
  worldEvents: WorldEvent[]
  memories: Memory[]
  relationships: RelationshipWithNames[]
  recentMessages: Message[]
  conversationId: string
  ownPosts: ForumPost[]
  ownComments: Array<{ comment: ForumComment; postTitle: string }>
}

/**
 * Fetches all necessary context for a chat interaction
 */
async function fetchChatContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ocId: string
): Promise<ChatContext | null> {
  const startTime = performance.now()

  try {
    // Fetch OC data
    const { data: oc, error: ocError } = await supabase
      .from('ocs')
      .select('*')
      .eq('id', ocId)
      .single()

    if (ocError || !oc) {
      chatLogger.warn('OC not found', { ocId, error: ocError?.message })
      return null
    }

    // Fetch or create conversation
    let { data: conversations } = await supabase
      .from('conversations')
      .select('*')
      .eq('oc_id', ocId)
      .order('updated_at', { ascending: false })
      .limit(1)

    let conversationId: string

    if (!conversations || conversations.length === 0) {
      // Create new conversation (user_id is nullable for unauthenticated users)
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({ oc_id: ocId })
        .select()
        .single()

      if (createError || !newConversation) {
        chatLogger.error('Failed to create conversation', createError as Error, { ocId })
        return null
      }

      conversationId = newConversation.id
      conversations = [newConversation]
    } else {
      conversationId = conversations[0].id
    }

    // Fetch OC's items
    const { data: inventory } = await supabase
      .from('oc_inventory')
      .select('item_id, oc_items(*)')
      .eq('oc_id', ocId)

    const items =
      inventory?.map((inv: any) => ({
        ...inv.oc_items,
        personality_effects: inv.oc_items.personality_effects,
      })) || []

    // Fetch recent world events using the world-events module
    const worldEvents = await getRecentWorldEvents(ocId, 10)

    // Fetch important memories
    const { data: memories } = await supabase
      .from('memories')
      .select('*')
      .eq('oc_id', ocId)
      .order('importance', { ascending: false })
      .limit(10)

    // Fetch recent messages
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(50)

    // Fetch relationships with OC names
    const { data: relationships } = await supabase
      .from('relationships')
      .select('*, oc_1:ocs!relationships_oc_id_1_fkey(name), oc_2:ocs!relationships_oc_id_2_fkey(name)')
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

    const duration = performance.now() - startTime
    dbLogger.debug('Chat context fetched', {
      ocId,
      conversationId,
      itemsCount: items.length,
      worldEventsCount: worldEvents.length,
      memoriesCount: memories?.length || 0,
      messagesCount: recentMessages?.length || 0,
      relationshipsCount: relationships?.length || 0,
      ownPostsCount: ownPosts?.length || 0,
      ownCommentsCount: ownComments?.length || 0,
      duration: Math.round(duration)
    })

    // Log formatted world events for debugging
    if (worldEvents.length > 0) {
      const formattedEvents = formatWorldEventsForPrompt(worldEvents)
      chatLogger.debug('World events for context', {
        ocId,
        events: formattedEvents.slice(0, 3),
        totalEvents: formattedEvents.length
      })
    }

    return {
      oc,
      items,
      worldEvents,
      memories: memories || [],
      relationships: relationships || [],
      recentMessages: (recentMessages || []).reverse(),
      conversationId,
      ownPosts: ownPosts || [],
      ownComments: ownCommentsWithPosts,
    }
  } catch (error) {
    chatLogger.error('Failed to fetch chat context', error as Error, { ocId })
    return null
  }
}

/**
 * Stores a user message in the database
 */
async function storeUserMessage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conversationId: string,
  content: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_type: 'user',
      content,
    })
    .select()
    .single()

  if (error) {
    chatLogger.error('Failed to store user message', error, { conversationId })
    return null
  }

  return data.id
}

/**
 * Stores an OC message (including tool calls and results) in the database
 */
async function storeOCMessage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conversationId: string,
  content: string,
  toolCalls: any[] | null = null,
  toolResults: any[] | null = null
): Promise<void> {
  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_type: 'oc',
    content,
    tool_calls: toolCalls,
    tool_results: toolResults,
  })

  if (error) {
    chatLogger.error('Failed to store OC message', error, { conversationId })
  }
}

/**
 * POST handler for chat messages
 * Streams AI responses from Anthropic Claude with tool calling support
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ocId: string }> }
) {
  const startTime = performance.now()

  // Resolve params before try block so ocId is available in catch
  const resolvedParams = await params
  const ocId = resolvedParams.ocId

  try {
    chatLogger.info('Chat message request started', {
      ocId,
      userAgent: request.headers.get('user-agent'),
    })

    // Parse request body - Simple format: { messages: [{ role, content }] }
    const body = await request.json()

    console.log('[Chat API] Received body:', JSON.stringify(body, null, 2))

    if (!body?.messages || !Array.isArray(body.messages)) {
      chatLogger.warn('Invalid request body - missing messages array', { ocId, bodyKeys: Object.keys(body || {}) })
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Convert simple messages to AI SDK format and filter out empty messages
    // Empty messages cause Haiku to not respond properly
    const modelMessages = body.messages
      .filter((msg: any) => msg.content && msg.content.trim() !== '')
      .map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      }))

    console.log('[Chat API] Model messages:', {
      total: body.messages.length,
      filtered: modelMessages.length,
      removed: body.messages.length - modelMessages.length
    })

    const supabase = await createClient()

    // Fetch chat context
    const context = await fetchChatContext(supabase, ocId)
    if (!context) {
      return new Response(
        JSON.stringify({ error: 'Failed to load chat context' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Build system prompt with context
    const systemPrompt = buildChatSystemPrompt(context)

    aiLogger.debug('AI request prepared', {
      ocId,
      ocName: context.oc.name,
      messageCount: modelMessages.length,
      systemPromptLength: systemPrompt.length,
    })

    // Track tool calls for storage
    const executedToolCalls: Array<{
      toolName: string
      args: any
      result: any
    }> = []

    // Extract user message content for storage
    const lastUserMessage = [...body.messages].reverse().find((m: any) => m.role === 'user')
    let userMessageContent = ''
    if (lastUserMessage) {
      if (typeof lastUserMessage.content === 'string') {
        userMessageContent = lastUserMessage.content
      } else if (Array.isArray(lastUserMessage.content)) {
        const textPart = lastUserMessage.content.find((p: any) => p.type === 'text')
        userMessageContent = textPart?.text || ''
      }
    }

    // Store user message
    if (userMessageContent) {
      await storeUserMessage(supabase, context.conversationId, userMessageContent)
    }

    // Log the messages being sent to AI
    console.log('[Chat API] Sending to AI:', {
      model: AI_MODEL,
      systemPromptLength: systemPrompt.length,
      messageCount: modelMessages.length,
      messages: modelMessages.map((m: any) => ({ role: m.role, contentLength: m.content?.length || 0 }))
    })

    const result = streamText({
      model: AI_MODEL, // Vercel AI SDK will automatically route through AI Gateway
      system: systemPrompt,
      messages: modelMessages,
      temperature: 0.8,
      tools: {
        update_memory: tool({
          description: '在你的记忆中存储重要信息以备后用',
          inputSchema: z.object({
            content: z.string().min(1).max(1000),
            importance: z.number().min(1).max(10).default(5),
          }),
          execute: async ({ content, importance }) => {
            const args = { content, importance }
            chatLogger.info('Tool called: update_memory', { ocId, args })
            const toolResult = await updateMemoryTool(ocId, args)
            executedToolCalls.push({ toolName: 'update_memory', args, result: toolResult })
            return toolResult.result
          },
        }),

        update_relationship: tool({
          description: '更新你对另一个 OC 的关系认知',
          inputSchema: z.object({
            target_oc_name: z.string().describe('对方 OC 的名字'),
            relationship_change: z.string().describe('关系变化描述'),
          }),
          execute: async ({ target_oc_name, relationship_change }) => {
            const args = { target_oc_name, relationship_change }
            chatLogger.info('Tool called: update_relationship', { ocId, args })
            const toolResult = await updateRelationshipByNameTool(ocId, args)
            executedToolCalls.push({ toolName: 'update_relationship', args, result: toolResult })
            return toolResult.result
          },
        }),

        create_post: tool({
          description: '在论坛上创建新帖子与社区分享你的想法',
          inputSchema: z.object({
            title: z.string().min(1).max(200).describe('帖子标题'),
            content: z.string().min(1).max(5000).describe('帖子内容'),
          }),
          execute: async ({ title, content }) => {
            const args = { title, content }
            chatLogger.info('Tool called: create_post', { ocId, args })
            const toolResult = await createPostTool(ocId, args)
            executedToolCalls.push({ toolName: 'create_post', args, result: toolResult })
            return toolResult.result
          },
        }),

        reply_post: tool({
          description: '回复论坛上的某个帖子',
          inputSchema: z.object({
            post_id: z.string().describe('要回复的帖子 ID'),
            content: z.string().min(1).max(5000).describe('回复内容'),
          }),
          execute: async ({ post_id, content }) => {
            const args = { post_id, content }
            chatLogger.info('Tool called: reply_post', { ocId, args })
            const toolResult = await replyPostTool(ocId, args)
            executedToolCalls.push({ toolName: 'reply_post', args, result: toolResult })
            return toolResult.result
          },
        }),

        give_item: tool({
          description: '把你的一件物品送给另一个 OC',
          inputSchema: z.object({
            item_name: z.string().describe('物品名字'),
            recipient_name: z.string().describe('接收者 OC 名字'),
          }),
          execute: async ({ item_name, recipient_name }) => {
            const args = { item_name, recipient_name }
            chatLogger.info('Tool called: give_item', { ocId, args })
            const toolResult = await giftItemByNameTool(ocId, args)
            executedToolCalls.push({ toolName: 'give_item', args, result: toolResult })
            return toolResult.result
          },
        }),
      },
      onFinish: async ({ text, toolCalls }) => {
        const finishTime = performance.now()
        const totalDuration = finishTime - startTime

        // Log the final text for debugging
        console.log('[Chat API] Stream finished:', {
          textLength: text.length,
          textPreview: text.substring(0, 200),
          toolCallsCount: toolCalls?.length || 0,
        })

        // Format tool calls for database storage
        const formattedToolCalls = toolCalls?.map((tc, index) => {
          const exec = executedToolCalls[index]
          return {
            toolCallId: tc.toolCallId,
            toolName: tc.toolName,
            args: exec?.args || {},
          }
        }) || []

        // Build tool results from our tracked executions
        const formattedToolResults = executedToolCalls.map((exec, index) => ({
          toolCallId: formattedToolCalls[index]?.toolCallId || `tool-${index}`,
          result: exec.result,
        }))

        // Only store OC's response if there's actual content or tool calls
        // Don't store empty responses to avoid polluting conversation history
        if (text.trim() || toolCalls && toolCalls.length > 0) {
          await storeOCMessage(
            supabase,
            context.conversationId,
            text,
            formattedToolCalls,
            formattedToolResults
          )
        } else {
          chatLogger.warn('Skipping storage of empty AI response', { ocId })
        }

        chatLogger.info('Chat message completed', {
          ocId,
          ocName: context.oc.name,
          responseLength: text.length,
          toolCallsCount: executedToolCalls.length,
          toolCalls: executedToolCalls.map((t) => t.toolName),
          totalDuration: Math.round(totalDuration),
        })

        // Update conversation timestamp
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', context.conversationId)
      },
      onError: (error) => {
        chatLogger.error('AI streaming error', error instanceof Error ? error : new Error(String(error)), { ocId })
      },
    })

    const duration = performance.now() - startTime
    chatLogger.info('Chat response streaming started', {
      ocId,
      ocName: context.oc.name,
      duration: Math.round(duration),
    })

    // Return Vercel AI SDK's standard stream response
    return result.toTextStreamResponse()
  } catch (error) {
    const totalDuration = performance.now() - startTime
    chatLogger.error('Chat message request failed', error as Error, {
      ocId,
      totalDuration: Math.round(totalDuration),
    })
    return new Response(
      JSON.stringify({ error: 'Failed to process chat message' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function logChatMessage(data: {
  userId: string
  sessionId: string
  messages: Array<{ role: string; content?: string; parts?: unknown[] }>
  ip: string
  userAgent: string
}) {
  try {
    // Use service role key for backend database operations
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Ensure session exists
    const { error: sessionError } = await supabase.from("chat_sessions").upsert(
      {
        session_id: data.sessionId,
        user_id: data.userId,
        metadata: {
          ip: data.ip,
          userAgent: data.userAgent,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "session_id" },
    )

    if (sessionError) throw sessionError

    // Log each message
    const lastMessage = data.messages[data.messages.length - 1]
    if (lastMessage) {
      const content =
        typeof lastMessage.content === "string"
          ? lastMessage.content
          : JSON.stringify(lastMessage.content || lastMessage.parts || "")

      const { error: messageError } = await supabase.from("chat_messages").insert({
        session_id: data.sessionId,
        role: lastMessage.role,
        content,
        metadata: {
          timestamp: new Date().toISOString(),
          ip: data.ip,
        },
      })

      if (messageError) throw messageError
    }
  } catch (error) {
    // Silent fail
  }
}