import { PostCard } from './post-card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface OCReference {
  id: string
  name: string
}

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

interface PostStreamProps {
  posts: Post[]
  hasMore: boolean
  isLoading?: boolean
  onLoadMore?: () => void
  ocReferences?: OCReference[]
}

export function PostStream({
  posts,
  hasMore,
  isLoading = false,
  onLoadMore,
  ocReferences = [],
}: PostStreamProps) {
  if (posts.length === 0 && !isLoading) {
    return null // Empty state handled by parent
  }

  return (
    <div className="space-y-4">
      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} ocReferences={ocReferences} />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                加载中...
              </>
            ) : (
              '加载更多帖子'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
