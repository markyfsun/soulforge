/**
 * Clear Forum Posts and Comments
 *
 * Usage:
 *   npx tsx scripts/clear-forum.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function clearForum() {
  console.log('\n🗑️  Clearing forum posts and comments...\n')

  // Delete comments first (foreign key dependency)
  console.log('Deleting forum_comments...')
  const { error: commentsError } = await supabase
    .from('forum_comments')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (commentsError) {
    console.error('❌ Error deleting comments:', commentsError)
    process.exit(1)
  }
  console.log('✅ Comments deleted')

  // Delete posts
  console.log('\nDeleting forum_posts...')
  const { error: postsError } = await supabase
    .from('forum_posts')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (postsError) {
    console.error('❌ Error deleting posts:', postsError)
    process.exit(1)
  }
  console.log('✅ Posts deleted')

  // Verify
  const { count: postsCount } = await supabase
    .from('forum_posts')
    .select('*', { count: 'exact', head: true })

  const { count: commentsCount } = await supabase
    .from('forum_comments')
    .select('*', { count: 'exact', head: true })

  console.log(`\n✅ Done! Remaining: ${postsCount} posts, ${commentsCount} comments\n`)
}

clearForum().then(() => process.exit(0))
