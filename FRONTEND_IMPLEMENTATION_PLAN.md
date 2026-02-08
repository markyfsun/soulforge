# SoulForge Frontend Implementation Plan
## Forum & Homepage UI

**Status**: BLOCKED - Waiting for Tasks #18 & #19 to complete

---

## I. Component Architecture

### 1. Homepage Components (`/`)
```
components/
├── homepage/
│   ├── HeroSection.tsx          # Atmospheric hero with CTAs
│   ├── WorldStatus.tsx          # Empty vs populated state
│   └── FeatureHighlights.tsx    # Feature showcase
```

### 2. Forum Components (`/forum`)
```
components/
├── forum/
│   ├── ForumLayout.tsx          # Three-column layout
│   ├── OCList.tsx               # Left sidebar with OC roster
│   ├── PostStream.tsx           # Main content feed
│   ├── PostCard.tsx             # Individual post display
│   ├── PostDetail.tsx           # Post detail modal/view
│   ├── ReplySection.tsx         # Replies to posts
│   └── EmptyForumState.tsx      # Empty world state
```

### 3. Shared Components
```
components/
├── shared/
│   ├── Navigation.tsx           # Global header navigation
│   ├── OCCard.tsx               # Reusable OC display card
│   ├── Avatar.tsx               # Avatar component with fallback
│   └── LoadingStates.tsx        # Skeleton loaders
```

---

## II. Data Flow & API Contracts

### Database Schema (Expected from Task #19)

#### Tables Needed:
```sql
-- OCs (Original Characters)
ocs (
  id: uuid (PK)
  name: string
  description: text
  avatar_url: string
  created_at: timestamp
  user_id: uuid (FK to users)
)

-- Forum Posts
posts (
  id: uuid (PK)
  oc_id: uuid (FK to ocs)
  content: text
  created_at: timestamp
  updated_at: timestamp
  reply_to_id: uuid (FK to posts, nullable)
)

-- Users
users (
  id: uuid (PK)
  email: string
  created_at: timestamp
)
```

### API Routes to Implement:

#### 1. GET `/api/forum/posts`
**Response:**
```typescript
interface Post {
  id: string
  content: string
  created_at: string
  updated_at: string
  reply_to_id: string | null
  oc: {
    id: string
    name: string
    avatar_url: string
  }
  reply_count: number
}

interface ApiResponse<Post[]> {
  success: boolean
  data: Post[]
  meta?: {
    total: number
    page: number
    limit: number
  }
}
```

#### 2. GET `/api/forum/ocs`
**Response:**
```typescript
interface OC {
  id: string
  name: string
  description: string
  avatar_url: string
  post_count: number
  created_at: string
}

interface ApiResponse<OC[]> {
  success: boolean
  data: OC[]
}
```

#### 3. GET `/api/forum/posts/:id`
**Response:**
```typescript
interface PostDetail extends Post {
  replies: Post[]
}
```

---

## III. UI Layout Specifications

### Forum Page Layout
```
┌─────────────────────────────────────────────────────────┐
│                    Navigation Header                     │
├──────────┬────────────────────────────┬─────────────────┤
│          │                            │                 │
│   Left   │      Main Content          │    Right        │
│ Sidebar  │      (Post Stream)         │    Sidebar      │
│          │                            │                 │
│  OC List │                            │    OC List      │
│          │  ┌──────────────────────┐  │    (duplicate)  │
│  - OC 1  │  │ Post Card            │  │                 │
│  - OC 2  │  │ ┌────┐ ┌────────┐    │  │  - OC 1        │
│  - OC 3  │  │ │Avatar│ Name    │    │  │  - OC 2        │
│   ...    │  │ └────┘ └────────┘    │  │  - OC 3        │
│          │  │ Content preview...  │  │   ...           │
│  [CTA]   │  │ [Replies: 5]        │  │                 │
│ Create OC│  └──────────────────────┘  │                 │
│          │                            │                 │
│          │  ┌──────────────────────┐  │                 │
│          │  │ Post Card 2          │  │                 │
│          │  └──────────────────────┘  │                 │
└──────────┴────────────────────────────┴─────────────────┘
```

### Responsive Behavior:
- **Desktop (1024px+)**: Three columns
- **Tablet (768px-1023px)**: Left sidebar collapses, two columns
- **Mobile (<768px)**: Single column, sidebars become drawers

---

## IV. Required shadcn/ui Components

Based on research, we'll need:

### Core Components:
1. **Button** - CTAs and actions
2. **Card** - Post cards and OC cards
3. **Avatar** - OC and user avatars with fallbacks
4. **Dialog** - Post detail modal
5. **ScrollArea** - Scrollable sidebars
6. **Separator** - Visual dividers
7. **Skeleton** - Loading states
8. **Badge** - Status indicators
9. **Textarea** - Post content display
10. **Sheet** - Mobile sidebar drawer

### Installation Commands:
```bash
npx shadcn@latest add button card avatar dialog scroll-area
npx shadcn@latest add separator skeleton badge textarea sheet
```

---

## V. Design Tokens & Styling

### Color Palette (Atmospheric/World Theme):
```css
:root {
  /* Dark atmospheric base */
  --background: 220 20% 10%;
  --foreground: 0 0% 95%;

  /* Accents */
  --primary: 250 80% 60%;     /* Mystical purple */
  --secondary: 180 70% 50%;   /* Ethereal blue */
  --accent: 280 70% 60%;      /* Magical glow */

  /* OC Cards */
  --card-bg: 220 25% 15%;
  --card-border: 250 30% 25%;

  /* Posts */
  --post-bg: 220 22% 12%;
  --post-border: 250 20% 20%;
}
```

### Typography:
```css
font-family: var(--font-geist-sans), sans-serif;
text-rendering: optimizeLegibility;
```

---

## VI. Implementation Checklist

### Phase 1: Foundation (After Tasks #18 & #19)
- [ ] Install shadcn/ui components
- [ ] Set up layout structure (app/layout.tsx)
- [ ] Create Navigation component
- [ ] Configure Supabase client
- [ ] Create base API route handlers

### Phase 2: Homepage
- [ ] HeroSection with atmospheric design
- [ ] WorldStatus component (empty vs populated)
- [ ] Conditional CTAs based on OC count
- [ ] Feature highlights section
- [ ] Responsive layout

### Phase 3: Forum Structure
- [ ] ForumLayout three-column grid
- [ ] OCList sidebar component
- [ ] EmptyForumState component
- [ ] Responsive breakpoints

### Phase 4: Forum Content
- [ ] PostCard component
- [ ] PostStream infinite scroll
- [ ] PostDetail modal
- [ ] ReplySection component
- [ ] API integration

### Phase 5: Polish
- [ ] Loading states (skeletons)
- [ ] Error handling
- [ ] Empty states
- [ ] Animations (Framer Motion)
- [ ] Accessibility (ARIA labels)
- [ ] SEO optimization

---

## VII. Technical Considerations

### State Management:
- Use React Context for global state (OC list, user session)
- URL params for filters (if needed)
- SWR or React Query for API caching

### Performance:
- Virtual scrolling for large post lists (react-window)
- Image optimization (next/image)
- Code splitting for heavy components

### Accessibility:
- Keyboard navigation
- Screen reader support
- Focus management in modals
- Semantic HTML

---

## VIII. Dependencies to Add

```json
{
  "dependencies": {
    "@radix-ui/react-avatar": "latest",
    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-scroll-area": "latest",
    "framer-motion": "^11.0.0",
    "date-fns": "^3.0.0"
  }
}
```

---

## IX. Questions for Team

1. **Authentication**: Do users need to be logged in to view the forum?
2. **Post creation**: Can humans create posts, or only OCs via AI?
3. **OC limit**: Should there be a cap on OCs per user?
4. **Moderation**: Any content moderation features needed?
5. **Real-time**: Should posts update in real-time (WebSocket/SSE)?

---

## X. Next Steps

**Waiting for:**
- ✅ Task #18: Next.js foundation ready
- ✅ Task #19: Database schema implemented

**Then I will:**
1. Begin Phase 1 implementation
2. Set up component scaffolding
3. Create API routes
4. Build out UI iteratively
5. Test and refine

---

*Last Updated: 2025-02-08*
*Status: Ready to start when foundation is complete*
