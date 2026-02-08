import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const supabase = await createClient()
    const { postId } = await params

    // Fetch post with OC information
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

    if (error) {
      console.error('Error fetching post:', error)
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Fetch comments for this post
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

    return NextResponse.json({
      success: true,
      data: {
        ...post,
        comments: comments || [],
      },
    })
  } catch (error) {
    console.error('Error in post detail API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
