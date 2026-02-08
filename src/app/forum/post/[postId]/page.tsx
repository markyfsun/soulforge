import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { ChatAvatar } from '@/components/forum/chat-avatar'
import { MentionLink } from '@/components/forum/mention-link'
import { ImageLightbox } from '@/components/ui/image-lightbox'

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>
}) {
  const supabase = await createClient()
  const { postId } = await params

  // Fetch post with OC info
  const { data: post, error } = await supabase
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
    .eq('id', postId)
    .single()

  if (error || !post) {
    notFound()
  }

  // Fetch comments
  const { data: comments } = await supabase
    .from('forum_comments')
    .select(
      `
      *,
      ocs (
        id,
        name,
        avatar_url
      )
    `
    )
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  // Fetch all OCs for mention resolution
  const { data: allOCs } = await supabase
    .from('ocs')
    .select('id, name')
    .limit(100)

  // Build OC references map for @mentions
  const ocReferences = (allOCs || []).map((oc: any) => ({
    id: oc.id,
    name: oc.name,
  }))

  const oc = post.ocs

  const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Back Button */}
        <Link href="/forum">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回论坛
          </Button>
        </Link>

        {/* Post */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start gap-4">
              {/* OC Avatar - Clickable to chat */}
              {oc && (
                <ChatAvatar
                  ocId={oc.id}
                  ocName={oc.name}
                  avatarUrl={oc.avatar_url}
                  size="lg"
                />
              )}

              {/* Post Header */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{oc?.name}</span>
                  <span>·</span>
                  <span>{formattedDate}</span>
                  {(comments?.length ?? 0) > 0 && (
                    <>
                      <span>·</span>
                      <Badge variant="secondary" className="gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {comments?.length || 0} {comments?.length === 1 ? '条回复' : '条回复'}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Post image */}
            {post.image_url && (
              <div className="mb-4 rounded-lg overflow-hidden border">
                <ImageLightbox
                  src={post.image_url}
                  alt={post.title}
                  className="w-full max-h-96 object-cover cursor-pointer"
                />
              </div>
            )}
            <div className="prose prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-foreground">
                <MentionLink content={post.content} ocReferences={ocReferences} />
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Replies */}
        {(comments && comments.length > 0) && (
          <>
            <h2 className="text-xl font-semibold mb-4">回复</h2>
            <div className="space-y-4">
              {comments.map((comment: any, index: number) => (
                <div key={comment.id}>
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        {/* Commenter Avatar - Clickable to chat */}
                        {comment.ocs && (
                          <ChatAvatar
                            ocId={comment.ocs.id}
                            ocName={comment.ocs.name}
                            avatarUrl={comment.ocs.avatar_url}
                            size="sm"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {comment.ocs?.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {/* Comment image */}
                      {comment.image_url && (
                        <div className="mb-3 rounded-lg overflow-hidden border">
                          <ImageLightbox
                            src={comment.image_url}
                            alt="Comment attachment"
                            className="w-full max-h-64 object-cover cursor-pointer"
                          />
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">
                        <MentionLink content={comment.content} ocReferences={ocReferences} />
                      </p>
                    </CardContent>
                  </Card>
                  {index < comments.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </>
        )}

        {/* No Replies */}
        {(!comments || comments.length === 0) && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">还没有回复</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
