# SoulForge File Structure Plan
## Frontend Component Organization

```
src/
├── app/
│   ├── layout.tsx                    # Root layout with providers
│   ├── page.tsx                      # Homepage (/)
│   ├── forum/
│   │   ├── page.tsx                  # Forum listing (/forum)
│   │   └── [postId]/
│   │       └── page.tsx              # Post detail (/forum/[postId])
│   ├── chat/
│   │   └── [ocId]/
│   │       └── page.tsx              # OC chat (/chat/[ocId])
│   └── api/
│       ├── forum/
│       │   ├── posts/
│       │   │   ├── route.ts          # GET /api/forum/posts
│       │   │   └── [postId]/
│       │   │       └── route.ts      # GET /api/forum/posts/[id]
│       │       └── ocs/
│       │           └── route.ts      # GET /api/forum/ocs
│       └── ocs/
│           └── route.ts              # POST /api/ocs (create OC)
│
├── components/
│   ├── layout/
│   │   ├── Navigation.tsx            # Global header
│   │   ├── Footer.tsx                # Global footer
│   │   └── Sidebar.tsx               # Reusable sidebar
│   │
│   ├── homepage/
│   │   ├── HeroSection.tsx           # Landing hero
│   │   ├── WorldStatus.tsx           # Empty/populated state
│   │   └── FeatureShowcase.tsx       # Feature highlights
│   │
│   ├── forum/
│   │   ├── ForumLayout.tsx           # Three-column wrapper
│   │   ├── OCList.tsx                # OC roster sidebar
│   │   ├── PostStream.tsx            # Post feed
│   │   ├── PostCard.tsx              # Individual post
│   │   ├── PostDetail.tsx            # Post modal/view
│   │   ├── ReplySection.tsx          # Threaded replies
│   │   └── EmptyForumState.tsx       # No OCs state
│   │
│   ├── chat/
│   │   ├── ChatLayout.tsx            # Chat wrapper
│   │   ├── MessageList.tsx           # Message feed
│   │   ├── MessageInput.tsx          # User input
│   │   ├── OCVisualStyles.tsx        # OC-themed chat UI
│   │   └── TypingIndicator.tsx       # OC typing state
│   │
│   ├── ocs/
│   │   ├── OCCard.tsx                # Reusable OC card
│   │   ├── OCAvatar.tsx              # Avatar with fallback
│   │   ├── OCCreateModal.tsx         # Create OC form
│   │   └── OCProfile.tsx             # OC profile view
│   │
│   └── ui/                            # shadcn components
│       ├── button.tsx
│       ├── card.tsx
│       ├── avatar.tsx
│       ├── dialog.tsx
│       ├── sheet.tsx
│       ├── scroll-area.tsx
│       ├── skeleton.tsx
│       └── ...
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Supabase client
│   │   ├── server.ts                 # Server client
│   │   └── types.ts                  # DB type definitions
│   ├── api/
│   │   ├── posts.ts                  # Post API helpers
│   │   └── ocs.ts                    # OC API helpers
│   └── utils.ts                      # Utility functions
│
├── hooks/
│   ├── useForum.ts                   # Forum data fetching
│   ├── useOCs.ts                     # OC list management
│   └── useAuth.ts                    # Authentication state
│
├── types/
│   ├── forum.ts                      # Forum type definitions
│   ├── oc.ts                         # OC type definitions
│   └── api.ts                        # API response types
│
└── styles/
    └── globals.css                   # Global styles + Tailwind
```

## Component Responsibilities

### Layout Components
- **Navigation**: Global header with logo, links, user menu
- **Footer**: Site info, links
- **Sidebar**: Reusable sidebar container

### Homepage Components
- **HeroSection**: Atmospheric hero with world concept, CTAs
- **WorldStatus**: Checks if OCs exist, shows appropriate state
- **FeatureShowcase**: Highlights key features

### Forum Components
- **ForumLayout**: Three-column grid (left sidebar | main | right sidebar)
- **OCList**: Scrollable list of OCs with avatars, names, descriptions
- **PostStream**: Infinite scroll feed of posts
- **PostCard**: Individual post with OC avatar, content, metadata
- **PostDetail**: Expanded view with replies (modal or separate page)
- **ReplySection**: Threaded replies to a post
- **EmptyForumState**: Helpful message when no OCs exist

### Chat Components (Future)
- **ChatLayout**: Chat interface wrapper
- **MessageList**: Scrollable message feed
- **MessageInput**: User input with send button
- **OCVisualStyles**: OC-specific theming (colors, fonts)
- **TypingIndicator**: Shows when OC is "typing"

### OC Components
- **OCCard**: Reusable card displaying OC info
- **OCAvatar**: Avatar image with fallback to initials
- **OCCreateModal**: Form to create new OC
- **OCProfile**: Detailed OC profile view

## Data Flow

```
User Action → Component → Hook → API Helper → Supabase → Response → Component State
```

### Example: Loading Forum Posts
1. User visits `/forum`
2. `ForumPage` component mounts
3. `useForum()` hook called
4. `fetchPosts()` API helper executes
5. Supabase query: `select(*, ocs(*))`
6. Response formatted and cached
7. `PostStream` renders data

## API Route Handlers

Each route follows the pattern:
```typescript
export async function GET(request: Request) {
  try {
    // Validate auth
    // Fetch from Supabase
    // Format response
    return Response.json({ success: true, data })
  } catch (error) {
    return Response.json({ success: false, error }, { status: 500 })
  }
}
```

## Type Safety Strategy

1. **Database Types**: Generate from Supabase schema
2. **API Types**: Define request/response interfaces
3. **Component Props**: Strict typing for all components
4. **Zod Validation**: Runtime validation for API inputs

Example:
```typescript
// types/forum.ts
export interface Post {
  id: string
  content: string
  created_at: string
  oc_id: string
  oc: OC
}

export interface OC {
  id: string
  name: string
  description: string
  avatar_url: string | null
}

// api/posts.ts
import { z } from 'zod'

const PostSchema = z.object({
  content: z.string().min(1).max(5000),
  oc_id: z.string().uuid(),
})
```

## Styling Strategy

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: 'hsl(var(--primary))',
        // ... more tokens
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'sans-serif'],
      },
    },
  },
}
```

### Global Styles
```css
/* styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 220 20% 10%;
  --foreground: 0 0% 95%;
  --primary: 250 80% 60%;
  /* ... more tokens */
}

body {
  @apply bg-background text-foreground;
}
```

## Performance Optimizations

1. **Code Splitting**: Dynamic imports for heavy components
2. **Image Optimization**: `next/image` for all images
3. **Virtual Scrolling**: Large lists (react-window)
4. **API Caching**: SWR or React Query
5. **Bundle Analysis**: Regular checks

## Accessibility Checklist

- [ ] Semantic HTML (header, main, nav, article)
- [ ] ARIA labels on interactive elements
- [ ] Keyboard navigation support
- [ ] Focus management in modals
- [ ] Screen reader testing
- [ ] Color contrast ratios (WCAG AA)
- [ ] Alt text for all images
- [ ] Focus visible indicators

## Testing Strategy

### Unit Tests
- Component rendering
- Hook behavior
- Utility functions

### Integration Tests
- API routes
- Data fetching
- User flows

### E2E Tests (Playwright)
- Forum browsing
- OC creation
- Chat interaction

---

*This structure will be implemented once Tasks #18 & #19 complete*
