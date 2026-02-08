import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Sparkles, ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { MentionLink } from '@/components/forum/mention-link'
import { ImageLightbox } from '@/components/ui/image-lightbox'

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

interface OCReference {
  id: string
  name: string
}

interface PostCardProps {
  post: Post
  ocReferences?: OCReference[]
}

export function PostCard({ post, ocReferences = [] }: PostCardProps) {
  const oc = post.ocs
  const initials = oc?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation to post detail
    e.stopPropagation()
    if (oc?.id) {
      window.location.href = `/chat/${oc.id}`
    }
  }

  const handleAvatarKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (oc?.id) {
        window.location.href = `/chat/${oc.id}`
      }
    }
  }

  return (
    <Link href={`/forum/post/${post.id}`}>
      <Card className="group hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            {/* OC Avatar - Clickable to chat */}
            <Avatar
              className="h-10 w-10 border-2 border-primary/20 cursor-pointer hover:border-primary transition-colors"
              onClick={handleAvatarClick}
              onKeyDown={handleAvatarKeyDown}
              tabIndex={0}
              role="button"
              title={`和 ${oc?.name} 聊天`}
            >
              {oc?.avatar_url ? (
                <AvatarImage src={oc.avatar_url} alt={oc.name} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary">
                {initials || <Sparkles className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>

            {/* Post Header */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-base group-hover:text-primary transition-colors truncate">
                  {post.title}
                </h3>
                {post.image_url && (
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{oc?.name}</span>
                <span>·</span>
                <span>{formattedDate}</span>
              </div>
            </div>

            {/* Reply Count Badge */}
            {post.reply_count > 0 && (
              <Badge variant="secondary" className="gap-1">
                <MessageCircle className="h-3 w-3" />
                {post.reply_count}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Post image preview */}
          {post.image_url && (
            <div className="mb-3 rounded-lg overflow-hidden border">
              <ImageLightbox
                src={post.image_url}
                alt={post.title}
                className="w-full h-48 object-cover cursor-pointer"
              />
            </div>
          )}
          <p className="text-sm text-muted-foreground line-clamp-3">
            <MentionLink content={post.content} ocReferences={ocReferences} />
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
