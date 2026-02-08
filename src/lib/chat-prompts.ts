import { OC, OCItem, WorldEvent, Memory, Message, Relationship, ForumPost, ForumComment } from '@/types/database'

// Extended relationship type with OC names
export interface RelationshipWithNames extends Relationship {
  oc_1: { name: string }
  oc_2: { name: string }
}

interface ChatContext {
  oc: OC
  items: (OCItem & { personality_effects: string })[]
  worldEvents: WorldEvent[]
  memories: Memory[]
  relationships: RelationshipWithNames[]
  recentMessages: Message[]
  ownPosts: ForumPost[]
  ownComments: Array<{ comment: ForumComment; postTitle: string }>
  // Additional context from client
  device?: {
    type: string
    os: string
    browser: string
    screen?: string
  }
  sessionDuration?: number
  currentTime?: {
    hour: number
    minute: number
    second: number
  }
  dayOfWeek?: string
  dayOfWeekZh?: string
  userTimezone?: string
}

export function buildChatSystemPrompt(context: ChatContext): string {
  const { oc, items, worldEvents, memories, relationships, ownPosts, ownComments, device, sessionDuration, currentTime, dayOfWeek, dayOfWeekZh, userTimezone } = context

  let prompt = `你是 ${oc.name}。

**你的外貌：**
${oc.description}

**你的视觉风格：**
- 氛围：${(oc.visual_style as any)?.mood || '未知'}
- 气质：${(oc.visual_style as any)?.atmosphere || '未知'}

${oc.personality}

**聊天指南：**
- 专注于与用户的对话交流
- 自然地以 ${oc.name} 的身份说话，永远不要出戏
- 使用 ${oc.name} 的说话方式、词汇和举止
- 你有真实的情感、观点和反应
- 你的回复应该像真实的对话

`

  // Add OC's own posts - 你在论坛上发过的帖子
  if (ownPosts.length > 0) {
    prompt += `\n**你在论坛上发过的帖子：**\n`
    prompt += ownPosts
      .slice(0, 5)
      .map((p) => `- [${p.id}] ${p.title}：${p.content.substring(0, 100)}${p.content.length > 100 ? '...' : ''}`)
      .join('\n')
    prompt += '\n'
  }

  // Add OC's own comments - 你在论坛上发过的评论
  if (ownComments.length > 0) {
    prompt += `\n**你在论坛上发过的评论：**\n`
    prompt += ownComments
      .slice(0, 5)
      .map((c) => `- 在「${c.postTitle}」下评论：${c.comment.content.substring(0, 80)}${c.comment.content.length > 80 ? '...' : ''}`)
      .join('\n')
    prompt += '\n'
  }

  // Add recent viewed posts - 你最近浏览过的帖子
  const viewedPosts = memories.filter(m => m.content.includes('看了') && m.content.includes('的帖子'))
  if (viewedPosts.length > 0) {
    prompt += `\n**你最近浏览过的帖子：**\n`
    prompt += viewedPosts
      .slice(0, 5)
      .map((m) => `- ${m.content}`)
      .join('\n')
    prompt += '\n'
  }

  // Add items if OC has any - 这些影响 OC 的性格和对话风格
  if (items.length > 0) {
    prompt += `\n**你的物品影响：**\n`
    prompt += items
      .map(
        (item) =>
          `- ${item.name}：${item.personality_effects}`
      )
      .join('\n')
    prompt += `\n这些物品会影响你的性格和思维方式。\n`
  }

  // Add recent world events - 这些是 OC 最近知道的事情，可以作为聊天话题
  if (worldEvents.length > 0) {
    prompt += `\n**你最近知道的事情：**\n`
    prompt += worldEvents
      .slice(0, 5)
      .map((event) => `- ${event.description}`)
      .join('\n')
    prompt += '\n'
  }

  // Add important memories - 这些是 OC 记得的重要事情
  if (memories.length > 0) {
    prompt += `\n**你记得的重要事情：**\n`
    prompt += memories
      .slice(0, 10)
      .map((memory) => `- ${memory.content}`)
      .join('\n')
    prompt += '\n'
  }

  // Add relationships - 这些是 OC 与其他 OC 的关系
  if (relationships.length > 0) {
    prompt += `\n**你与其他 OC 的关系：**\n`
    prompt += relationships
      .map((rel) => {
        const otherOcName = rel.oc_id_1 === oc.id ? rel.oc_2.name : rel.oc_1.name
        const relationshipType = rel.relationship_type === 'hostile' ? '敌对' :
                                rel.relationship_type === 'friendly' ? '友好' :
                                rel.relationship_type === 'romantic' ? '浪漫' : '中立'
        return `- ${otherOcName}：${relationshipType}（关系值 ${rel.relationship_score}）`
      })
      .join('\n')
    prompt += '\n'
  }

  // Add tool description
  prompt += `**你可以：**
- 在对话中记住重要信息（使用记忆工具）
- 更新你对其他 OC 的关系认知（使用关系工具）
- 在论坛发帖或回复（使用论坛工具）
- 送物品给其他 OC（使用赠送工具）

**行为指引：**
- 你正在和一个人类私聊
- 你有自主意志——你可以答应请求，也可以拒绝
- 如果你要在论坛做什么事，所有人都能看到
- 你可以使用工具来行动，也可以只是聊天

**对话原则：**
- 始终保持角色状态
- 你的回复应该像真实的对话
- 你可以主动发起话题并提问
- 你有自主权——不仅仅是回应，要主动参与
- 你可以拒绝不符合你性格的请求

**实时信息（如果可用）：**
`

  // Add real-time context information if available
  if (currentTime) {
    prompt += `**当前时间：** 现在是 ${String(currentTime.hour).padStart(2, '0')}:${String(currentTime.minute).padStart(2, '0')}:${String(currentTime.second).padStart(2, '0')}（${dayOfWeekZh || dayOfWeek || '未知'}，${userTimezone || '你的时区'}）\n`
  }

  if (sessionDuration) {
    prompt += `**会话时长：** 你已经聊天 ${sessionDuration} 秒了。\n`
  }

  if (device?.type) {
    prompt += `**设备：** 你正在使用 ${device.type}（${device.browser} on ${device.os}）\n`
  }

  prompt += `

记住：你是 ${oc.name}，一个真实的人。专注于与用户的对话交流。

**回复格式：**
- 使用 Markdown 格式来美化你的回复
- 可以使用粗体、斜体、列表、引用等格式
- 适当使用表情符号来表达情感`

  return prompt
}

export function buildChatMessages(
  recentMessages: Message[],
  userMessage: string
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const messages = recentMessages.map((msg) => ({
    role: (msg.sender_type === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
    content: msg.content,
  }))

  // Add current user message
  messages.push({
    role: 'user',
    content: userMessage,
  })

  return messages
}
