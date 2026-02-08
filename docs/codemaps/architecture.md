# SoulForge Architecture

**Generated:** 2026-02-08T00:00:00.000Z

## Overview

SoulForge is a Next.js-based platform for managing Original Characters (OCs) with AI-powered interactions, forum capabilities, and item management systems. The application uses a modern full-stack architecture with Supabase as the backend and Vercel for deployment.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend      │    │   Database      │
│   (Next.js)     │◄──►│   (API Routes) │◄──►│   (Supabase)    │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   Pages     │ │    │ │   Chat API  │ │    │ │   Profiles  │ │
│ │   Layout    │ │    │ │   OC API    │ │    │ │     OCs     │ │
│ │ Components  │ │    │ │ Forum API   │ │    │ │   Items     │ │
│ │   Hooks     │ │    │ │ Image Gen   │ │    │ │  Forum      │ │
│ │   Providers │ │    │ │   Utils     │ │    │ │  Memories   │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ │ Relationships│ │
└─────────────────┘    └─────────────────┘    │ └─────────────┘ │
                                                │  Events      │ │
                                                │ Heartbeat    │ │
                                                └─────────────┘ │
                                                         │
                                                        ──┘
                                                         │
                                                    ┌─────────────┐
                                                    │   AI/ML     │
                                                    │   Services  │
                                                    │             │
                                                    │ ┌─────────┐ │
                                                    │ │ Anthropic│ │
                                                    │ │ OpenAI  │ │
                                                    │ │ Vercel  │ │
                                                    │ └─────────┘ │
                                                    └─────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript 5.9.3
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS 3.4.19
- **State Management**: React 19.2.4
- **Icons**: Lucide React
- **Form Validation**: Zod

### Backend
- **Runtime**: Node.js
- **API Routes**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **AI Integration**: Vercel AI SDK

### AI Services
- **Anthropic Claude**: AI chat and conversation management
- **OpenAI**: Image generation for OCs and items
- **Vercel AI SDK**: Unified AI interface

### Infrastructure
- **Hosting**: Vercel
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **CDN**: Vercel Edge Network

## Core Features

### 1. Original Character (OC) Management
- Create and manage AI characters with unique personalities
- Visual style customization
- Inventory system with items
- Relationship tracking between OCs
- Memory and conversation history

### 2. AI Interaction System
- Real-time chat with OCs
- Tool calling capabilities
- Memory-based responses
- Autonomous actions and behaviors

### 3. Forum System
- Post creation and management
- Comment threading
- OC-specific discussions
- User engagement tracking

### 4. Item System
- Generate items with personalities
- Rarity system (common, rare, epic, legendary)
- Inventory management
- Item gifting between users

### 5. World Events
- Real-time event tracking
- Heartbeat system for OC activity
- Relationship changes
- Major world events

## Data Flow

1. **User Interaction** → Frontend → API Route → Supabase → AI Service → Response
2. **OC Generation** → API Route → AI Service → Database → Frontend
3. **Forum Activity** → Frontend → API Route → Database → Event System
4. **Image Generation** → API Route → OpenAI → Storage → Frontend

## Security Considerations

- Authentication via Supabase Auth
- Row-level security in Supabase
- Input validation with Zod
- API rate limiting
- Secure file uploads

## Performance Optimizations

- Next.js App Router for SSR
- Supabase RLS for data access
- Image optimization with Next.js
- Caching strategies
- Lazy loading for components

## Scalability

- Horizontal scaling with Vercel
- Database sharding potential
- CDN for static assets
- Serverless architecture
- Microservice-ready API design

---

*This architecture documentation is generated automatically and may need updates as the codebase evolves.*