# SoulForge Frontend Structure

**Generated:** 2026-02-08T00:00:00.000Z

## Overview

The frontend is built with Next.js 16 using the App Router pattern, React 19, and TypeScript. It follows a component-based architecture with proper separation of concerns and modern React patterns.

## Directory Structure

```
src/
├── app/
│   ├── api/                           # API routes (backend)
│   ├── forum/
│   │   ├── page.tsx                   # Forum homepage
│   │   ├── post/
│   │   │   └── [postId]/
│   │   │       └── page.tsx           # Individual post page
│   │   └── layout.tsx                # Forum layout
│   ├── summon/
│   │   ├── layout.tsx                 # Summon page layout
│   │   └── page.tsx                   # OC summon page
│   ├── layout.tsx                     # Root layout
│   ├── page.tsx                       # Home page
│   └── globals.css                   # Global styles
├── components/
│   ├── forum/                         # Forum components
│   │   ├── forum-page.tsx             # Main forum interface
│   │   ├── forum-post.tsx             # Post component
│   │   ├── forum-comment.tsx          # Comment component
│   │   └── post-form.tsx              # Post creation form
│   ├── homepage/                      # Homepage components
│   │   └── hero-section.tsx           # Hero section
│   ├── layout/                        # Layout components
│   │   ├── header.tsx                 # Navigation header
│   │   ├── footer.tsx                 # Page footer
│   │   └── sidebar.tsx                # Sidebar navigation
│   ├── providers/                     # Context providers
│   │   ├── theme-provider.tsx          # Theme context
│   │   └── supabase-provider.tsx      # Supabase auth provider
│   ├── ui/                            # Reusable UI components
│   │   ├── button.tsx                 # Button component
│   │   ├── input.tsx                  # Input field
│   │   ├── dialog.tsx                 # Modal dialog
│   │   ├── avatar.tsx                 # User avatar
│   │   ├── separator.tsx             # Visual separator
│   │   └── scroll-area.tsx            # Scrollable area
│   └── chat/                          # Chat components
│       ├── chat-container.tsx         # Chat interface
│       ├── message-bubble.tsx        # Message display
│       ├── chat-input.tsx            # Message input
│       └── chat-history.tsx          # Message history
├── lib/
│   ├── api/                           # API client utilities
│   │   ├── chat.ts                    # Chat API client
│   │   ├── forum.ts                   # Forum API client
│   │   ├── ocs.ts                    # OC API client
│   │   └── items.ts                   # Item API client
│   ├── chat-tools.ts                  # Chat-specific tools
│   ├── chat-prompts.ts                # Chat prompt templates
│   ├── oc-prompts.ts                 # OC generation prompts
│   ├── logger.ts                     # Logging utilities
│   └── supabase/
│       ├── client.ts                 # Supabase client
│       └── server.ts                 # Server-side client
├── types/                             # TypeScript definitions
│   └── database.ts                    # Database types
└── utils/                             # Utility functions
    ├── cn.ts                         # Class name merging
    └── index.ts                      # Common utilities
```

## Component Architecture

### 1. Layout Components

#### Root Layout (`app/layout.tsx`)
- Sets up HTML structure
- Providers initialization
- Global styles

```typescript
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SupabaseProvider>
            {children}
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

#### Header (`components/layout/header.tsx`)
- Navigation menu
- User authentication status
- Search functionality

### 2. Page Components

#### Home Page (`app/page.tsx`)
```typescript
export default async function HomePage() {
  const hasOCs = await checkWorldHasOCs()
  const ocCount = await getOCCount()

  return (
    <main>
      <HeroSection hasOCs={hasOCs} ocCount={ocCount} />
    </main>
  )
}
```

#### Forum Page (`app/forum/page.tsx`)
- Forum listing
- Post creation
- Navigation

### 3. UI Components

#### Button (`components/ui/button.tsx`)
- Variants: default, destructive, outline, secondary, ghost, link
- Sizes: default, sm, lg, icon
- Accessibility support

#### Input (`components/ui/input.tsx`)
- Text inputs
- Validation states
- Label support

#### Dialog (`components/ui/dialog.tsx`)
- Modal dialogs
- Confirmation dialogs
- Form dialogs

### 4. Forum Components

#### Forum Page (`components/forum/forum-page.tsx`)
- Main forum interface
- Post listing
- Pagination
- Search and filtering

#### Forum Post (`components/forum/forum-post.tsx`)
- Post display
- Author information
- Timestamp
- Comment threading

### 5. Chat Components

#### Chat Container (`components/chat/chat-container.tsx`)
- Chat interface
- Message history
- Input area
- Typing indicators

#### Message Bubble (`components/chat/message-bubble.tsx`)
- Message display
- Sender identification
- Timestamp
- Tool call results

## State Management

### 1. React Context

#### Theme Provider (`components/providers/theme-provider.tsx`)
- Dark/light mode switching
- System preference detection
- Persistent theme selection

#### Supabase Provider (`components/providers/supabase-provider.tsx`)
- Authentication state
- User profile data
- Session management

### 2. Custom Hooks

#### API Data Fetching
```typescript
// Example: Custom hook for OC data
export function useOCs() {
  const [ocs, setOCs] = useState<OC[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOCs() {
      const data = await getAllOCs()
      setOCs(data)
      setLoading(false)
    }
    fetchOCs()
  }, [])

  return { ocs, loading }
}
```

#### Form State Management
- Form validation
- Submission handling
- Error states

## Styling Architecture

### 1. Tailwind CSS Configuration
- Custom color palette
- Spacing scale
- Typography scale
- Component variants

### 2. CSS Architecture
- Utility-first approach
- Component-specific styles
- Responsive design
- Dark mode support

### 3. Theme System
- Light/dark mode
- Custom properties
- Consistent spacing
- Typography scale

## API Integration

### 1. API Client Utilities

#### Chat API (`lib/api/chat.ts`)
```typescript
export async function sendMessage(message: string, ocId: string) {
  const supabase = createClient()

  const { data, error } = await supabase.functions.invoke('chat', {
    body: { message, ocId }
  })

  if (error) throw error
  return data
}
```

#### Forum API (`lib/api/forum.ts`)
- Post operations
- Comment management
- User interactions

### 2. Data Fetching Patterns

#### Server Components
- Direct database access
- API route calls
- Server-side rendering

#### Client Components
- API client utilities
- State management
- User interactions

## Performance Optimizations

### 1. Code Splitting
- Dynamic imports
- Route-based splitting
- Component lazy loading

### 2. Image Optimization
- Next.js Image component
- WebP format
- Lazy loading
- Responsive images

### 3. Bundle Analysis
- Tree shaking
- Unused code elimination
- Vendor chunk optimization

## Accessibility

### 1. ARIA Support
- Semantic HTML
- Screen reader compatibility
- Keyboard navigation
- Focus management

### 2. WCAG Compliance
- Color contrast
- Text sizing
- Interactive elements
- Error messages

### 3. Mobile Responsiveness
- Touch targets
- Responsive design
- Mobile-first approach
- Device testing

## Error Boundaries

### 1. Error Handling
- Component error boundaries
- Error states
- Fallback UI
- Error logging

### 2. Loading States
- Skeleton loaders
- Loading indicators
- Progressive loading
- User feedback

---

*This frontend documentation is generated automatically and may need updates as the codebase evolves.*