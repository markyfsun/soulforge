# SoulForge AI Features - Documentation Index

This directory contains all technical documentation for implementing SoulForge's AI-powered features.

## 📚 Documentation Files

### 1. [database-schema.md](./database-schema.md)
**Database design for OCs, items, posts, chat, and world events**

- 8 core tables with relationships
- SQL schema with indexes and constraints
- JSONB columns for flexible data
- Migration order and security considerations

**Key Tables:**
- `ocs` - AI characters with personalities
- `items` - Items that modify personalities
- `messages` - Chat with tool calling metadata
- `world_events` - Global context for all OCs

---

### 2. [ai-prompt-structures.md](./ai-prompt-structures.md)
**Prompt engineering patterns for OC generation and chat**

- OC summoning prompt with example
- Dynamic chat system prompt template
- Tool definitions for all 5 tools
- Context window management strategy
- Streaming response pattern
- Quality assurance checklist

**Key Features:**
- Generates unique OCs with personalities, items, and intro posts
- Dynamic context from OC + items + world events + memories
- Tool calling for autonomous OC behavior

---

### 3. [ai-implementation-plan.md](./ai-implementation-plan.md)
**Step-by-step implementation guide**

- Prerequisites and environment setup
- 4-phase implementation plan
- Code examples for all API routes
- Testing strategy (unit + integration)
- Performance optimization tips
- Error handling patterns
- Deployment checklist

**Phases:**
1. Core Infrastructure (Supabase client, types)
2. OC Summoning Feature (POST /api/oc/summon)
3. AI Chat with Tool Calling (streaming responses)
4. Chat Page with Visual Styles (three-layer layout)

---

## 🚀 Quick Start

### For Foundation Team:
1. Read `database-schema.md` → Execute migrations
2. Set up Next.js with App Router
3. Configure Supabase client
4. Set environment variables

### For AI Implementation:
1. Verify prerequisites from `ai-implementation-plan.md`
2. Follow phases in order
3. Use prompts from `ai-prompt-structures.md`
4. Test thoroughly with provided test cases

---

## 🔧 Technical Stack

- **Framework:** Next.js 14+ (App Router)
- **Database:** Supabase (PostgreSQL)
- **AI:** Anthropic Claude 3.5 Sonnet
- **Streaming:** Vercel AI SDK
- **Language:** TypeScript (strict mode)

---

## 📊 Data Flow

```
User submits description
  ↓
/api/oc/summon (Claude generates OC)
  ↓
Insert OC + items + post + world_event
  ↓
User navigates to /chat/[ocId]
  ↓
Fetches OC data, items, world events, memories
  ↓
Builds dynamic system prompt
  ↓
Streams response from Claude
  ↓
OC uses tools autonomously
  ↓
Persists messages and tool results
```

---

## 🎯 Success Criteria

### OC Summoning:
- ✅ Generates unique OC names
- ✅ Creates 3-5 items per OC
- ✅ Auto-creates introductory post
- ✅ Logs world event
- ✅ Handles name conflicts gracefully

### AI Chat:
- ✅ Streams responses in real-time
- ✅ OC stays in character
- ✅ Tools used appropriately
- ✅ Context injected correctly
- ✅ Handles tool calling errors

### Chat Page:
- ✅ OC-specific visual styles
- ✅ Items orbit avatar
- ✅ Three-layer layout
- ✅ Message persistence
- ✅ Responsive design

---

## 📝 Notes

- All prompts are production-ready
- Database schema is production-ready
- Code examples are TypeScript
- Streaming implemented with Vercel AI SDK
- Tool calling handled via Anthropic Claude
- Context budget: ~15K tokens per request

---

## 🤝 Coordination

**Foundation Team Tasks:**
- Set up Next.js project
- Execute database migrations
- Configure Supabase
- Set up authentication (optional)

**AI Team Tasks:**
- Implement OC summoning API
- Implement chat API with tool calling
- Build chat UI with visual styles
- Test all features end-to-end

---

## ⏱️ Time Estimates

After foundation is complete:
- OC Summoning: 2-3 hours
- AI Chat with Tool Calling: 3-4 hours
- Chat Page: 2-3 hours
- Testing & Refinement: 2-3 hours

**Total: 8-12 hours**

---

## 📞 Questions?

Refer to specific documentation:
- Database questions → `database-schema.md`
- Prompt engineering → `ai-prompt-structures.md`
- Implementation details → `ai-implementation-plan.md`

Or coordinate via team messages.

---

**Last Updated:** 2026-02-08
**Status:** Ready for implementation once foundation is complete
