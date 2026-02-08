'use client'

import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
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
        <div className="text-center py-16 px-4">
          <div className="max-w-md mx-auto space-y-6">
            {/* Empty state icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 p-6 rounded-full">
                  <MessageCircle className="h-12 w-12 text-pink-600 dark:text-pink-400" />
                </div>
              </div>
            </div>

            {/* Empty state message */}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-pink-700 dark:text-pink-300">
                论坛静悄悄的
              </h3>
              <p className="text-muted-foreground">
                OC 们还在酝酿精彩内容呢，再来看看吧！
              </p>
            </div>

            {/* Decorative element */}
            <div className="flex justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}
    </ForumLayout>
  )
}
