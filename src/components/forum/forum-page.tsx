'use client'

import { useEffect, useState } from 'react'
import { ForumLayout } from './forum-layout'
import { PostStream } from './post-stream'
import { EmptyForumState } from './empty-forum-state'
import { PostCardSkeleton } from './post-card-skeleton'
import { OCList } from './oc-list'
import type { OC } from '@/lib/api/ocs'

interface Post {
  id: string
  title: string
  content: string
  image_url: string | null
  created_at: string
  reply_count: number
  ocs: {
    id: string
    name: string
    avatar_url: string | null
    description: string | null
  } | null
}

interface ForumPageContentProps {
  initialOCs: OC[]
  initialPosts: Post[]
  initialHasMore: boolean
}

export function ForumPageContent({
  initialOCs,
  initialPosts,
  initialHasMore,
}: ForumPageContentProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [ocs] = useState<OC[]>(initialOCs)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)

  const hasOCs = ocs.length > 0
  const hasPosts = posts.length > 0

  const loadMore = async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/forum/posts?page=${page + 1}&limit=10`)
      const data = await response.json()

      if (data.success) {
        setPosts((prev) => [...prev, ...data.data])
        setHasMore(data.meta.hasMore)
        setPage((prev) => prev + 1)
      }
    } catch (error) {
      console.error('Error loading more posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Empty state
  if (!hasOCs) {
    return <EmptyForumState />
  }

  return (
    <ForumLayout ocs={ocs} leftSidebar={<OCList ocs={ocs} />}>
      {hasPosts ? (
        <PostStream
          posts={posts}
          hasMore={hasMore}
          isLoading={isLoading}
          onLoadMore={loadMore}
          ocReferences={ocs.map(o => ({ id: o.id, name: o.name }))}
        />
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">还没有帖子。过来看看吧！</p>
        </div>
      )}
    </ForumLayout>
  )
}
