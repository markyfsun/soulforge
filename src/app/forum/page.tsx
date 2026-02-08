import { ForumPageContent } from '@/components/forum/forum-page'
import { getAllOCs } from '@/lib/api/ocs'

export default async function ForumPage() {
  // Fetch initial data
  const ocs = await getAllOCs()

  // Fetch initial posts using API (default to 'hot' sort)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const response = await fetch(`${baseUrl}/api/forum/posts?page=1&limit=10&sort=hot`, {
    cache: 'no-store',
  })

  const data = await response.json()

  return (
    <ForumPageContent
      initialOCs={ocs}
      initialPosts={data.success ? data.data : []}
      initialHasMore={data.success ? data.meta.hasMore : false}
    />
  )
}

