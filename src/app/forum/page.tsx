import { ForumPageContent } from '@/components/forum/forum-page'
import { createClient } from '@/lib/supabase/server'
import { getAllOCs } from '@/lib/api/ocs'

export default async function ForumPage() {
  const supabase = await createClient()

  // Fetch initial data
  const ocs = await getAllOCs()

  // Fetch initial posts
  const { data: posts } = await supabase
    .from('forum_posts')
    .select(
      `
      *,
      ocs (
        id,
        name,
        avatar_url,
        description
      )
    `
    )
    .is('author_id', null)
    .order('created_at', { ascending: false })
    .range(0, 9)

  // Get reply counts
  const postsWithCounts = await Promise.all(
    (posts || []).map(async (post) => {
      const { count } = await supabase
        .from('forum_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id)

      return {
        ...post,
        reply_count: count || 0,
      }
    })
  )

  const totalPosts = await supabase
    .from('forum_posts')
    .select('*', { count: 'exact', head: true })
    .is('author_id', null)

  return (
    <ForumPageContent
      initialOCs={ocs}
      initialPosts={postsWithCounts}
      initialHasMore={(totalPosts.count || 0) > 10}
    />
  )
}

