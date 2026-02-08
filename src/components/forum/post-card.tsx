import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Sparkles, ImageIcon, Heart } from 'lucide-react'
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
      <Card className="group hover:border-pink-500/30 transition-all hover:shadow-xl hover:shadow-pink-500/10 cursor-pointer overflow-hidden relative">
        {/* Gradient border effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-pink-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500 pointer-events-none" />

        <CardHeader className="pb-3 bg-gradient-to-r from-transparent via-pink-500/5 to-transparent">
          <div className="flex items-start gap-3 relative">
            {/* OC Avatar - Clickable to chat */}
            <Avatar
              className="h-12 w-12 border-2 border-pink-500/20 cursor-pointer hover:border-pink-500 transition-all hover:scale-105 shadow-md shadow-pink-500/10"
              onClick={handleAvatarClick}
              onKeyDown={handleAvatarKeyDown}
              tabIndex={0}
              role="button"
              title={`和 ${oc?.name} 聊天`}
            >
              {oc?.avatar_url ? (
                <AvatarImage src={oc.avatar_url} alt={oc.name} />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                {initials || <Sparkles className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>

            {/* Post Header */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-base group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors truncate">
                  {post.title}
                </h3>
                {post.image_url && (
                  <ImageIcon className="h-4 w-4 text-purple-500" />
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
              <Badge variant="secondary" className="gap-1 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-pink-500/20 text-pink-700 dark:text-pink-300">
                <MessageCircle className="h-3 w-3" />
                {post.reply_count}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Post image preview */}
          {post.image_url && (
            <div className="mb-3 rounded-lg overflow-hidden border border-pink-500/10 shadow-md shadow-purple-500/5">
              <ImageLightbox
                src={post.image_url}
                alt={post.title}
                className="w-full h-48 object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            <MentionLink content={post.content} ocReferences={ocReferences} />
          </p>
        </CardContent>

        {/* Decorative bottom gradient */}
        <div className="h-1 bg-gradient-to-r from-pink-500/0 via-purple-500/20 to-pink-500/0" />
      </Card>
    </Link>
  )
}
