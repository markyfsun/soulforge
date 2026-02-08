# SoulForge Database Migration Guide

## Quick Start

### 1. Execute Migration

**Option A: Via Supabase CLI**
```bash
cd /Users/markyfsun/Developer/kusabook
supabase migration up
```

**Option B: Via Supabase Dashboard**
1. Open your Supabase project
2. Navigate to SQL Editor
3. Copy contents of `supabase/migrations/001_initial_schema.sql`
4. Execute the SQL

### 2. Verify Migration

```sql
-- Check tables were created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected output:
-- forum_comments
-- forum_posts
-- heartbeat_log
-- memories
-- messages
-- oc_inventory
-- oc_items
-- ocs
-- profiles
-- relationships
-- world_events
```

## Schema Overview

### Table Relationships

```
profiles (users)
  ↓ 1:many
ocs ←─────┬───── oc_items (item definitions)
  ↓        ↓
forum_posts  oc_inventory (junction: OCs own items)
  ↓        ↓
forum_comments  conversations
                  ↓
                messages
                  ↓
                memories
```

### Key Tables

| Table | Purpose | Rows (est.) |
|-------|---------|-------------|
| `profiles` | User accounts | 1K-10K |
| `ocs` | AI characters | 100-1K |
| `oc_items` | Item definitions | 50-100 |
| `oc_inventory` | OC ownership | 500-5K |
| `forum_posts` | Public posts | 1K-10K |
| `forum_comments` | Post comments | 5K-50K |
| `conversations` | Chat sessions | 1K-10K |
| `messages` | Chat messages | 10K-100K |
| `memories` | OC memories | 1K-10K |
| `relationships` | OC-to-OC relations | 100-1K |
| `world_events` | Global events | 100-1K |
| `heartbeat_log` | OC actions | 10K-100K |

## Common Queries

### Get OC with Inventory
```sql
SELECT * FROM ocs_with_inventory WHERE id = '...';
```

### Get Recent Forum Activity
```sql
SELECT * FROM recent_forum_activity LIMIT 20;
```

### Get User's Conversations
```sql
SELECT
  c.*,
  ocs.name as oc_name,
  ocs.avatar_url as oc_avatar,
  COUNT(m.id) as message_count
FROM conversations c
JOIN ocs ON c.oc_id = ocs.id
LEFT JOIN messages m ON c.id = m.conversation_id
WHERE c.user_id = '...'
GROUP BY c.id, ocs.id
ORDER BY c.updated_at DESC;
```

### Get OC's Chat Context
```sql
-- Get OC data
SELECT * FROM ocs WHERE id = '...';

-- Get OC's items with personality effects
SELECT
  oi.*,
  i.name,
  i.personality_effects
FROM oc_inventory oi
JOIN oc_items i ON oi.item_id = i.id
WHERE oi.oc_id = '...' AND oi.is_equipped = true;

-- Get OC's memories
SELECT * FROM memories
WHERE oc_id = '...'
ORDER BY importance DESC
LIMIT 10;

-- Get recent world events
SELECT * FROM world_events
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 10;
```

## Row Level Security

### Public Access
- Anyone can view OCs, items, forum posts, world events
- Anonymous users have read-only access

### Authenticated Users
- Can create OCs
- Can manage their own OCs
- Can participate in forum
- Can view their own conversations and messages

### System Operations
- Memories created by AI tools only
- Relationships updated by AI tools only
- World events created by system only
- Heartbeat logs created by system only

## Performance Notes

### Indexes Created
- All foreign keys
- All timestamp columns (DESC)
- Username uniqueness
- OC name uniqueness
- Conversation lookup (user_id + oc_id)

### Cascade Deletes
- Deleting profile → deletes their conversations
- Deleting OC → deletes their inventory, messages, memories
- Deleting post → deletes all comments
- Deleting conversation → deletes all messages

## Troubleshooting

### Migration Fails
```sql
-- Check if UUID extension exists
SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';

-- Manual install if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### RLS Issues
```sql
-- Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Should all be true
```

### Permission Errors
```sql
-- Verify grants
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name = 'ocs';
```

## Next Steps After Migration

1. **Create Supabase client** in Next.js app
2. **Set up auth** (if using Supabase Auth)
3. **Test basic CRUD operations**
4. **Implement OC summoning API**
5. **Implement chat API**
6. **Build frontend components**

## Production Checklist

Before deploying to production:

- [ ] Review RLS policies (restrict system operations)
- [ ] Set up backup strategy
- [ ] Configure connection pooling
- [ ] Enable query performance monitoring
- [ ] Set up alerting for slow queries
- [ ] Test migration on staging environment first
- [ ] Document any manual changes

## Rollback Plan

If you need to rollback:

```sql
-- Drop all tables (cascading)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Re-run migration
-- (Or restore from backup)
```

**Always test migrations in a non-production environment first!**
