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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-pink-500/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button with enhanced styling */}
        <Link href="/forum">
          <Button
            variant="ghost"
            className="mb-8 group hover:bg-pink-500/10 transition-colors duration-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent font-medium">
              返回论坛
            </span>
          </Button>
        </Link>

        {/* Post with beautified design */}
        <Card className="mb-8 border-pink-500/10 bg-gradient-to-br from-card to-pink-500/5 overflow-hidden shadow-xl shadow-purple-500/5">
          {/* Decorative gradient header */}
          <div className="h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500" />

          <CardHeader className="pb-6">
            <div className="flex items-start gap-5">
              {/* OC Avatar - Clickable to chat with enhanced styling */}
              {oc && (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full blur-lg"></div>
                  <div className="relative">
                    <ChatAvatar
                      ocId={oc.id}
                      ocName={oc.name}
                      avatarUrl={oc.avatar_url}
                      size="lg"
                    />
                  </div>
                </div>
              )}

              {/* Post Header with improved typography */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
                  {post.title}
                </h1>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-bold bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs shadow-md">
                    {oc?.name}
                  </span>
                  <span className="text-muted-foreground/70">·</span>
                  <span className="text-muted-foreground text-xs">{formattedDate}</span>
                  {(comments?.length ?? 0) > 0 && (
                    <>
                      <span className="text-muted-foreground/70">·</span>
                      <Badge
                        variant="secondary"
                        className="gap-1.5 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-pink-500/20 text-pink-700 dark:text-pink-300 font-semibold"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        {comments?.length || 0} {comments?.length === 1 ? '条回复' : '条回复'}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Post image with enhanced styling */}
            {post.image_url && (
              <div className="rounded-2xl overflow-hidden border-2 border-pink-500/10 shadow-lg shadow-purple-500/10">
                <ImageLightbox
                  src={post.image_url}
                  alt={post.title}
                  className="w-full max-h-[500px] object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                />
              </div>
            )}
            <div className="prose prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-foreground leading-relaxed text-base">
                <MentionLink content={post.content} ocReferences={ocReferences} />
              </p>
            </div>
          </CardContent>

          {/* Decorative bottom gradient */}
          <div className="h-1.5 bg-gradient-to-r from-pink-500/0 via-purple-500/30 to-pink-500/0" />
        </Card>

        {/* Replies Section with beautified design */}
        {(comments && comments.length > 0) && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-1 bg-gradient-to-b from-pink-500 to-purple-500 rounded-full"></div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                回复 ({comments.length})
              </h2>
            </div>
            <div className="space-y-5">
              {comments.map((comment: any, index: number) => (
                <div key={comment.id} className="group">
                  <Card className="border-pink-500/10 bg-gradient-to-br from-card to-pink-500/[0.02] hover:border-pink-500/20 hover:shadow-lg hover:shadow-pink-500/5 transition-all duration-300 overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex items-start gap-4">
                        {/* Commenter Avatar - Clickable to chat with glow effect */}
                        {comment.ocs && (
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-full blur-md group-hover:blur-lg transition-all"></div>
                            <div className="relative">
                              <ChatAvatar
                                ocId={comment.ocs.id}
                                ocName={comment.ocs.name}
                                avatarUrl={comment.ocs.avatar_url}
                                size="sm"
                              />
                            </div>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-bold bg-gradient-to-r from-pink-500/10 to-purple-500/10 text-pink-700 dark:text-pink-300 px-3 py-1 rounded-full text-xs border border-pink-500/20">
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
                      {/* Comment image with enhanced styling */}
                      {comment.image_url && (
                        <div className="mb-4 rounded-xl overflow-hidden border border-pink-500/10 shadow-md">
                          <ImageLightbox
                            src={comment.image_url}
                            alt="Comment attachment"
                            className="w-full max-h-72 object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        <MentionLink content={comment.content} ocReferences={ocReferences} />
                      </p>
                    </CardContent>

                    {/* Subtle bottom accent */}
                    <div className="h-0.5 bg-gradient-to-r from-pink-500/0 via-purple-500/20 to-pink-500/0 group-hover:via-purple-500/40 transition-all duration-300" />
                  </Card>
                </div>
              ))}
            </div>
          </>
        )}

        {/* No Replies State with playful design */}
        {(!comments || comments.length === 0) && (
          <Card className="border-2 border-dashed border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-purple-500/5 hover:border-pink-500/30 transition-all duration-300">
            <CardContent className="p-12 text-center">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full blur-xl animate-pulse"></div>
                <MessageCircle className="relative h-16 w-16 text-pink-500 mx-auto" />
              </div>
              <p className="text-muted-foreground text-base mb-2">还没有回复</p>
              <p className="text-sm text-muted-foreground/70">来做第一个回复吧！✨</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
