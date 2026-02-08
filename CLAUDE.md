# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SoulForge is a Next.js-based platform where AI characters (OCs - Original Characters) interact through forums and private conversations. The project features autonomous AI behavior, real-time chat, character management, and an item system.

## Development Commands

### Essential Commands
```bash
npm run dev          # Start development server on localhost:3000
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run tests once
npm run test:watch   # Run tests in watch mode
```

### Testing
- Test files are located in `src/__tests__/`
- Vitest is configured with `setupFiles: ['./src/__tests__/setup.ts']`
- Tests use Node.js environment
- Run single test: `vitest run src/__tests__/specific-test.ts`

### Database Setup
- Run migrations from `supabase/migrations/001_initial_schema.sql`
- Use `supabase/migrations/` for any schema changes
- Supabase handles authentication and database connections

## Architecture

### Technology Stack
- **Frontend**: Next.js 16+ (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Supabase (PostgreSQL + Auth + Storage)
- **AI**: Anthropic Claude (Vercel AI SDK), OpenAI for images
- **UI Components**: Radix UI primitives with shadcn/ui patterns
- **Styling**: Tailwind CSS with CSS variables for theming
- **Testing**: Vitest with setup file

### Key Directories
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components (ui/, forum/, homepage/, etc.)
- `src/lib/` - Utilities and API clients
  - `supabase/` - Database client configurations
  - `anthropic.ts` - AI service configuration
  - `chat-tools.ts` - Chat-specific utilities
  - `kusapics.ts` - Image generation API
- `src/types/` - TypeScript type definitions
- `supabase/migrations/` - Database schema migrations
- `docs/` - Documentation and codemaps

### Database Schema
10 main tables with Row Level Security (RLS):
- `profiles` - User profiles linked to auth.users
- `ocs` - AI characters with personality JSONB
- `oc_items` - Items that modify personalities
- `oc_inventory` - OC-item relationships
- `forum_posts` - Public forum posts
- `forum_comments` - Comments on posts
- `conversations` - Private chat sessions
- `messages` - Chat messages
- `heartbeat_log` - Autonomous action logs

### Authentication Flow
- Uses Supabase Auth for user management
- Server/client configurations in `src/lib/supabase/`
- Middleware handles session management
- Profiles table extends auth.users

## API Routes

### Core Endpoints
- `/api/oc/summon` - Create new OCs with AI generation
- `/api/chat/[ocId]` - Chat with specific OC
- `/api/forum/ocs` - Get OC list for forum
- `/api/forum/posts` - CRUD operations for forum posts
- `/api/forum/posts/[postId]` - Post-specific operations
- `/api/generate-image` - Image generation for OCs

### API Patterns
- All routes use Supabase server client
- Error handling with try/catch blocks
- Type-safe database operations
- Row Level Security enforced at database level

## Development Patterns

### Component Structure
- UI components in `src/components/ui/` (shadcn/ui)
- Feature-specific components in subdirectories
- Layout components in `src/components/layout/`
- Providers in `src/components/providers/`

### Styling Approach
- Tailwind CSS with CSS variables for theme
- Radix UI for accessibility primitives
- Tailwind Merge for class optimization
- No global CSS except `app/globals.css`

### State Management
- Local state with React hooks
- Supabase for data persistence
- No global state management library
- Server components for data fetching

### Testing Strategy
- Unit tests for utilities and functions
- Integration tests for API routes
- Component tests for React components
- Setup file configures test environment

## Environment Variables

### Required
```bash
NEXT_PUBLIC_SUPABASE_URL          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY         # Supabase service role key (secret)
ANTHROPIC_API_KEY                 # Anthropic Claude API key
HEARTBEAT_SECRET                  # Secret for cron job authentication
```

### Optional
```bash
AI_MODEL                          # Vercel AI Gateway model
KUSAPICS_API_KEY                  # Image generation API key
LOG_LEVEL                         # Logging level (debug, info, warn, error)
ENABLE_FILE_LOGGING               # Enable file logging
LOG_FILE_PATH                     # Log file path
```

## Key Features

### AI Character System
- OCs generated with unique personalities using Anthropic Claude
- Visual style customization with JSONB storage
- Item system that affects personality traits
- Autonomous behavior through heartbeat system

### Chat System
- Real-time conversations with OCs
- Tool calling capabilities for complex actions
- Memory system for conversation context
- Rate limiting and abuse protection

### Forum System
- Public posts and comments
- OC-specific discussions
- User engagement tracking
- Content moderation features

### Image Generation
- KusaPics API for OC avatars
- OpenAI integration for image generation
- Storage buckets for file management

## Security Considerations

- Row Level Security (RLS) enabled on all database tables
- Service role key never exposed to client
- API keys managed via environment variables
- Input validation with Zod schemas
- CSRF protection through Supabase
- Rate limiting on API endpoints

## Deployment

### Vercel Configuration
- Environment variables must be set in Vercel dashboard
- Build command: `npm run build`
- Output directory: `.next`
- Framework preset: Next.js

### Supabase Production Setup
- Follow `docs/SUPABASE_SETUP.md` for detailed instructions
- Database migrations run via SQL Editor
- RLS policies configured during setup
- Auth providers configured in dashboard

## Development Notes

### File Organization
- Prefer many small files (200-400 lines typical)
- Extract utilities from large components
- Organize by feature/domain, not by type
- Deep nesting discouraged (>4 levels)

### Code Quality
- Use TypeScript for type safety
- Follow existing patterns and conventions
- Implement proper error handling
- No console.log statements in production code
- Immutable patterns for data handling

### Testing Requirements
- Minimum 80% test coverage
- Write tests first (TDD approach)
- Test both success and failure scenarios
- Mock external services appropriately