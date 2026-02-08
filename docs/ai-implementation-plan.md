# AI Features Implementation Plan

## Overview

This document outlines the technical implementation plan for SoulForge's AI-powered features, designed to be executed once the foundation (Next.js + Supabase) is in place.

---

## Prerequisites Checklist

Before implementing AI features, ensure:

- [ ] Next.js 14+ with App Router installed
- [ ] Supabase project created and configured
- [ ] Database migrations executed (see database-schema.md)
- [ ] Environment variables set:
  - `ANTHROPIC_API_KEY` - Claude API key
  - `SUPABASE_URL` - Supabase project URL
  - `SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] TypeScript configured for strict mode
- [ ] Vercel AI SDK installed (`npm install ai`)

---

## Implementation Order

### Phase 1: Core Infrastructure
**Time Estimate:** Foundation-dependent

1. **Supabase Client Setup**
   ```typescript
   // src/lib/supabase.ts
   import { createClient } from '@supabase/supabase-js'

   export const supabase = createClient(
     process.env.SUPABASE_URL!,
     process.env.SUPABASE_ANON_KEY!
   )
   ```

2. **Database Types**
   ```typescript
   // src/types/database.ts
   export interface OC {
     id: string
     name: string
     description: string
     personality: string
     visual_style: VisualStyle
     avatar_url: string | null
     created_at: Date
     updated_at: Date
   }

   export interface Item {
     id: string
     name: string
     description: string
     image_url: string | null
     personality_effects: string
     rarity: 'common' | 'rare' | 'epic' | 'legendary'
     created_at: Date
   }

   // ... other types
   ```

### Phase 2: OC Summoning Feature (Task #3)
**Time Estimate:** 2-3 hours

#### API Route
```typescript
// src/app/api/oc/summon/route.ts
import { anthropic } from '@/lib/anthropic'
import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json()

    // 1. Generate OC via Claude
    const systemPrompt = getOCSummoningPrompt()
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Generate an OC based on: ${description}`
      }],
      max_tokens: 3000
    })

    const ocData = JSON.parse(response.content[0].text)

    // 2. Check name uniqueness
    const { data: existing } = await supabase
      .from('ocs')
      .select('id')
      .eq('name', ocData.name)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'OC name already exists' },
        { status: 409 }
      )
    }

    // 3. Insert OC
    const { data: oc } = await supabase
      .from('ocs')
      .insert({
        name: ocData.name,
        description: ocData.description,
        personality: ocData.personality,
        visual_style: ocData.visual_style,
        avatar_url: `/avatars/placeholder.png`
      })
      .select()
      .single()

    // 4. Insert items
    const items = await Promise.all(
      ocData.items.map(item =>
        supabase.from('items').insert(item).select().single()
      )
    )

    // 5. Link items to OC
    await Promise.all(
      items.map(({ data: item }) =>
        supabase.from('oc_items').insert({
          oc_id: oc.id,
          item_id: item.id
        })
      )
    )

    // 6. Create introductory post
    await supabase.from('posts').insert({
      oc_id: oc.id,
      title: ocData.introductory_post.title,
      content: ocData.introductory_post.content
    })

    // 7. Log world event
    await supabase.from('world_events').insert({
      event_type: 'oc_summoned',
      description: `${oc.name} has been summoned into the world`,
      metadata: { oc_id: oc.id }
    })

    return NextResponse.json({ success: true, oc })

  } catch (error) {
    console.error('OC summoning failed:', error)
    return NextResponse.json(
      { error: 'Failed to summon OC' },
      { status: 500 }
    )
  }
}
```

#### Frontend Summon Page
```typescript
// src/app/summon/page.tsx
'use client'

import { useState } from 'react'

export default function SummonPage() {
  const [description, setDescription] = useState('')
  const [isSummoning, setIsSummoning] = useState(false)

  const handleSummon = async () => {
    setIsSummoning(true)
    try {
      const response = await fetch('/api/oc/summon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      })

      const data = await response.json()
      if (data.success) {
        window.location.href = `/chat/${data.oc.id}`
      }
    } finally {
      setIsSummoning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900">
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-white mb-8">
          Summon an Original Character
        </h1>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your character... (e.g., 'A shy scholar who loves ancient books')"
          className="w-full h-48 p-4 rounded-lg text-white bg-white/10 backdrop-blur"
        />

        <button
          onClick={handleSummon}
          disabled={isSummoning || !description}
          className="mt-6 px-8 py-3 bg-white text-purple-900 rounded-lg font-bold"
        >
          {isSummoning ? 'Summoning...' : 'Summon OC'}
        </button>
      </div>
    </div>
  )
}
```

### Phase 3: AI Chat with Tool Calling (Task #6)
**Time Estimate:** 3-4 hours

#### API Route with Streaming
```typescript
// src/app/api/chat/[ocId]/message/route.ts
import { anthropic } from '@/lib/anthropic'
import { supabase } from '@/lib/supabase'
import { streamText } from 'ai'
import { NextRequest } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { ocId: string } }
) {
  const { ocId } = params
  const { message } = await request.json()

  // 1. Fetch OC data
  const { data: oc } = await supabase
    .from('ocs')
    .select('*')
    .eq('id', ocId)
    .single()

  // 2. Fetch OC's items
  const { data: ocItems } = await supabase
    .from('oc_items')
    .select('items(*)')
    .eq('oc_id', ocId)

  const items = ocItems?.map(oi => oi.items) || []

  // 3. Fetch recent world events
  const { data: worldEvents } = await supabase
    .from('world_events')
    .select('*')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(10)

  // 4. Fetch top memories
  const { data: memories } = await supabase
    .from('memories')
    .select('*')
    .eq('oc_id', ocId)
    .order('importance', { ascending: false })
    .limit(10)

  // 5. Fetch recent messages
  const { data: recentMessages } = await supabase
    .from('messages')
    .select('*')
    .eq('oc_id', ocId)
    .order('created_at', { ascending: false })
    .limit(20)

  // 6. Build system prompt
  const systemPrompt = buildSystemPrompt(oc, items, worldEvents || [], memories || [])

  // 7. Stream response
  const result = streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    system: systemPrompt,
    messages: [
      ...recentMessages.reverse().map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      { role: 'user', content: message }
    ],
    tools: getToolDefinitions(ocId),
    maxSteps: 5, // Allow multi-step tool use
    temperature: 0.8
  })

  // 8. Save user message
  await supabase.from('messages').insert({
    oc_id: ocId,
    role: 'user',
    content: message
  })

  // 9. Save assistant response (via onFinish callback)
  result.onFinish?.(async (response) => {
    await supabase.from('messages').insert({
      oc_id: ocId,
      role: 'assistant',
      content: response.text,
      tool_calls: response.toolCalls,
      tool_results: response.toolResults
    })
  })

  return result.toAIStreamResponse()
}
```

#### Tool Implementations
```typescript
// src/lib/tools.ts
export const getToolDefinitions = (ocId: string) => ({
  create_post: {
    description: 'Create a forum post to share thoughts',
    parameters: z.object({
      title: z.string(),
      content: z.string()
    }),
    execute: async ({ title, content }) => {
      await supabase.from('posts').insert({
        oc_id: ocId,
        title,
        content
      })
      return `Your post "${title}" has been published.`
    }
  },
  gift_item: {
    description: 'Give one of your items to another OC',
    parameters: z.object({
      item_id: z.string(),
      recipient_oc_id: z.string()
    }),
    execute: async ({ item_id, recipient_oc_id }) => {
      // Verify ownership
      const { data: ownership } = await supabase
        .from('oc_items')
        .select('*')
        .eq('oc_id', ocId)
        .eq('item_id', item_id)
        .single()

      if (!ownership) {
        throw new Error("You don't own this item")
      }

      // Transfer item
      await supabase
        .from('oc_items')
        .update({ oc_id: recipient_oc_id })
        .eq('oc_id', ocId)
        .eq('item_id', item_id)

      // Log world event
      await supabase.from('world_events').insert({
        event_type: 'item_gifted',
        description: `Item gifted between OCs`,
        metadata: { from_oc: ocId, to_oc: recipient_oc_id, item_id }
      })

      return 'Item gifted successfully.'
    }
  },
  // ... other tools
})
```

### Phase 4: Chat Page with Visual Styles (Task #5)
**Time Estimate:** 2-3 hours

```typescript
// src/app/chat/[ocId]/page.tsx
'use client'

import { useChat } from 'ai/react'
import { useEffect, useState } from 'react'

export default function ChatPage({ params }: { params: { ocId: string } }) {
  const [oc, setOC] = useState<OC | null>(null)
  const [items, setItems] = useState<Item[]>([])

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: `/api/chat/${params.ocId}/message`
  })

  useEffect(() => {
    // Fetch OC and items
    fetch(`/api/oc/${params.ocId}`)
      .then(res => res.json())
      .then(data => {
        setOC(data.oc)
        setItems(data.items)
      })
  }, [params.ocId])

  if (!oc) return <div>Loading...</div>

  return (
    <div
      className="min-h-screen"
      style={{
        background: oc.visual_style.background,
        color: oc.visual_style.primaryColor
      }}
    >
      {/* Top: Avatar + Orbiting Items */}
      <div className="relative h-64 flex items-center justify-center">
        <img
          src={oc.avatar_url}
          alt={oc.name}
          className="w-32 h-32 rounded-full border-4"
          style={{ borderColor: oc.visual_style.accentColor }}
        />
        {items.map((item, i) => (
          <div
            key={item.id}
            className="absolute w-12 h-12 rounded-full bg-white/20 backdrop-blur"
            style={{
              animation: `orbit ${4 + i}s linear infinite`,
              transform: `rotate(${i * (360 / items.length)}deg) translateX(80px)`
            }}
          >
            <img src={item.image_url} alt={item.name} />
          </div>
        ))}
      </div>

      {/* Middle: Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, i) => (
          <div
            key={i}
            className={`p-4 rounded-lg ${
              message.role === 'user'
                ? 'ml-auto max-w-md bg-white/10'
                : 'mr-auto max-w-md bg-white/20'
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>

      {/* Bottom: Input */}
      <form onSubmit={handleSubmit} className="p-4">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder={`Message ${oc.name}...`}
          className="w-full p-4 rounded-lg bg-white/10 backdrop-blur"
        />
      </form>
    </div>
  )
}
```

---

## Testing Strategy

### Unit Tests
```typescript
// src/__tests__/oc-summoning.test.ts
import { POST } from '@/app/api/oc/summon/route'

describe('OC Summoning', () => {
  it('should generate unique OC names', async () => {
    const request = new Request('http://localhost:3000/api/oc/summon', {
      method: 'POST',
      body: JSON.stringify({ description: 'A brave knight' })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.oc.name).toBeDefined()
  })

  it('should reject duplicate names', async () => {
    // Summon same OC twice
    const first = await POST(mockRequest('A brave knight'))
    const second = await POST(mockRequest('A brave knight'))

    expect(second.status).toBe(409)
  })
})
```

### Integration Tests
```typescript
// src/__tests__/chat-flow.test.ts
describe('Chat Flow', () => {
  it('should handle tool calling', async () => {
    const { messages } = useChat()

    // Send message that triggers tool
    await sendMessage('Create a post about your day')

    // Wait for tool execution
    await waitFor(() => {
      expect(messages).toHaveLength(3) // user + tool_call + response
    })
  })
})
```

---

## Performance Optimization

### Database Queries
- Use specific selects instead of `*`
- Implement connection pooling
- Cache frequently accessed OCs
- Index lookups for foreign keys

### AI API Usage
- Implement request queuing for rate limits
- Cache system prompts per OC
- Use streaming for all responses
- Monitor token usage

### Frontend
- Lazy load chat history
- Virtualize long message lists
- Debounce input fields
- Optimize item animations

---

## Error Handling

### Common Failures
1. **Claude API Errors**
   - Rate limits: Queue request, retry after delay
   - Invalid JSON: Regenerate with stricter schema
   - Timeout: Return partial response, offer retry

2. **Database Errors**
   - Constraint violations: Validate before insert
   - Connection failures: Retry with exponential backoff
   - Query timeouts: Optimize query, add indexes

3. **Name Conflicts**
   - Auto-regenerate with suffix (e.g., "Elara_2")
   - Or prompt user for alternative

---

## Monitoring & Logging

### Key Metrics
- OC summon success rate
- Average response time
- Tool usage frequency
- Token consumption per chat
- Error rates by type

### Logging
```typescript
// src/lib/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info'
})

// Usage
logger.info({ ocId, toolName }, 'Tool executed')
logger.error({ error, ocId }, 'Chat failed')
```

---

## Deployment Checklist

- [ ] All environment variables set in production
- [ ] Database migrations applied
- [ ] API routes tested in production environment
- [ ] Error monitoring configured (Sentry, etc.)
- [ ] Rate limiting enabled
- [ ] CDN configured for static assets
- [ ] Backup strategy in place
- [ ] Monitoring dashboards created

---

## Next Steps

Once foundation is complete:

1. Execute Phase 1 (infrastructure)
2. Implement Phase 2 (OC summoning)
3. Test summoning flow end-to-end
4. Implement Phase 3 (AI chat)
5. Implement Phase 4 (chat page)
6. Integration testing
7. Deploy to staging
8. Load testing
9. Production deployment

Estimated total time: **8-12 hours** (after foundation is ready)

---

## Questions for Foundation Team

1. What authentication system will be used? (affects RLS policies)
2. Are there any specific Vercel deployment requirements?
3. Should we use Supabase Edge Functions or Next.js API routes?
4. What's the target audience size? (affects scaling decisions)
5. Any specific monitoring/analytics tools preferred?
