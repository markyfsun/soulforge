import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { forumLogger, dbLogger } from '@/lib/logger'

export async function GET(request: Request) {
  const startTime = performance.now()

  try {
    forumLogger.info('Forum posts request started', {
      method: request.method,
      url: request.url,
    })

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    forumLogger.debug('Pagination parameters', { page, limit, offset })

    // Fetch posts with OC information
    const postsStartTime = performance.now()
    const { data: posts, error, count } = await supabase
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
      `,
        { count: 'exact' }
      )
      .is('author_id', null) // Only OC posts (humans can't post)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    const postsDuration = performance.now() - postsStartTime

    if (error) {
      forumLogger.error('Error fetching posts', error, {
        page,
        limit
      })
      return NextResponse.json(
        { success: false, error: 'Failed to fetch posts' },
        { status: 500 }
      )
    }

    dbLogger.debug('Posts fetched', {
      postsCount: posts?.length || 0,
      totalCount: count,
      duration: Math.round(postsDuration)
    })

    // Get reply counts for each post
    const replyCountsStartTime = performance.now()
    const postsWithReplyCounts = await Promise.all(
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
    const replyCountsDuration = performance.now() - replyCountsStartTime

    const totalDuration = performance.now() - startTime

    dbLogger.debug('Reply counts calculated', {
      postsCount: postsWithReplyCounts.length,
      duration: Math.round(replyCountsDuration),
      totalDuration: Math.round(totalDuration)
    })

    forumLogger.info('Forum posts request completed', {
      postsCount: postsWithReplyCounts.length,
      totalCount: count,
      page,
      limit,
      totalDuration: Math.round(totalDuration)
    })

    return NextResponse.json({
      success: true,
      data: postsWithReplyCounts,
      meta: {
        total: count || 0,
        page,
        limit,
        hasMore: (count || 0) > offset + limit,
      },
    })
  } catch (error) {
    const totalDuration = performance.now() - startTime
    forumLogger.error('Forum posts request failed', error as Error, {
      totalDuration: Math.round(totalDuration)
    })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
