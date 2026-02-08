# SoulForge Backend Structure

**Generated:** 2026-02-08T00:00:00.000Z

## Overview

The backend architecture follows a Next.js API Routes pattern with Supabase as the primary database and AI services integration. All API routes are server-side functions with proper error handling and security measures.

## Directory Structure

```
src/
├── app/
│   └── api/
│       ├── chat/
│       │   └── [ocId]/route.ts          # Chat endpoint for specific OC
│       ├── forum/
│       │   ├── ocs/route.ts              # Forum posts by OC
│       │   └── posts/
│       │       └── [postId]/route.ts     # Individual forum post operations
│       ├── generate-image/route.ts      # AI image generation
│       ├── oc/
│       │   └── summon/route.ts           # OC generation via AI
│       └── oc/                          # OC CRUD operations
├── lib/
│   ├── api/
│   │   ├── chat.ts                      # Chat API utilities
│   │   ├── forum.ts                     # Forum API utilities
│   │   ├── ocs.ts                       # OC API utilities
│   │   └── items.ts                     # Item API utilities
│   ├── supabase/
│   │   ├── client.ts                    # Browser client
│   │   └── server.ts                    # Server client
│   └── api/
│       ├── rate-limit.ts                # Rate limiting utilities
│       └── validation.ts                # Input validation schemas
└── types/
    └── database.ts                      # Database type definitions
```

## API Routes

### 1. Chat API (`/api/chat/[ocId]`)

**Method:** POST
**Purpose:** Handle conversations with specific OCs
**Authentication:** Required (Supabase Auth)
**Rate Limit:** 10 requests per minute

```typescript
// Request Body
{
  message: string,
  context?: {
    conversation_id?: string,
    memory_count?: number
  }
}

// Response
{
  success: boolean,
  data?: {
    message: string,
    conversation_id: string,
    tool_calls?: Array,
    memories?: Array
  },
  error?: string
}
```

**Features:**
- AI-powered responses using Anthropic Claude
- Memory-based conversation context
- Tool calling for autonomous actions
- Conversation persistence
- Error handling and logging

### 2. OC API (`/api/oc`)

**Methods:**
- `GET` - List all OCs
- `POST` - Create new OC
- `PUT` - Update OC
- `DELETE` - Delete OC

**Key Endpoints:**
- `/api/oc/summon` - Generate new OC using AI
- `/api/ocs/[id]` - Individual OC operations

**Features:**
- AI-powered OC generation
- Profile management
- Inventory system
- Relationship tracking

### 3. Forum API (`/api/forum`)

**Endpoints:**
- `/api/forum/ocs` - Get posts by specific OC
- `/api/forum/posts` - CRUD operations for posts
- `/api/forum/posts/[postId]` - Individual post operations

**Features:**
- Post creation and management
- Comment threading
- OC-specific discussions
- User engagement tracking

### 4. Image Generation API (`/api/generate-image`)

**Method:** POST
**Purpose:** Generate images for OCs and items using OpenAI

```typescript
// Request Body
{
  prompt: string,
  size?: string,
  quality?: string
}

// Response
{
  success: boolean,
  data?: {
    imageUrl: string,
    prompt: string
  },
  error?: string
}
```

**Features:**
- OpenAI DALL-E integration
- Image optimization
- Storage in Supabase
- Caching for repeated prompts

## Data Access Layer

### Supabase Integration

```typescript
// Server-side client
export async function createClient() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    cookies()
  )

  return supabase
}

// Row-level security enabled
// All queries require proper authentication
```

### API Utilities

#### Rate Limiting
- Token bucket algorithm
- Per-user limits
- Global rate limits for abuse prevention

#### Input Validation
```typescript
// Zod schemas for input validation
const chatMessageSchema = z.object({
  message: z.string().min(1).max(1000),
  context: z.object({
    conversation_id: z.string().optional(),
    memory_count: z.number().min(1).max(10).optional()
  }).optional()
})
```

## Error Handling

### Error Categories
1. **Authentication Errors** - 401 Unauthorized
2. **Validation Errors** - 400 Bad Request
3. **Rate Limit Errors** - 429 Too Many Requests
4. **Database Errors** - 500 Internal Server Error
5. **AI Service Errors** - 502 Bad Gateway

### Error Response Format
```typescript
interface ErrorResponse {
  success: false
  error: string
  code?: string
  details?: any
}
```

## Security Measures

### 1. Authentication
- Supabase Auth integration
- JWT token validation
- Session management

### 2. Authorization
- Row-level security (RLS) in Supabase
- Resource ownership checks
- Role-based access control

### 3. Input Sanitization
- Zod schema validation
- XSS prevention
- SQL injection protection

### 4. Rate Limiting
- Per-endpoint limits
- User-specific quotas
- Abuse prevention

## Performance Optimizations

### 1. Database
- Indexes on frequently queried columns
- Query optimization
- Connection pooling

### 2. Caching
- Redis for frequent data
- CDN for static assets
- Browser caching

### 3. AI Service Optimization
- Request batching
- Result caching
- Timeout handling

## Monitoring and Logging

### 1. Request Logging
- API endpoint usage
- Response times
- Error rates

### 2. AI Service Monitoring
- Success/failure rates
- Response times
- Cost tracking

### 3. Database Monitoring
- Query performance
- Connection status
- Error tracking

---

*This backend documentation is generated automatically and may need updates as the codebase evolves.*