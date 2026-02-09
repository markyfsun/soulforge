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
    const sort = searchParams.get('sort') || 'hot' // 'hot' or 'latest'
    const offset = (page - 1) * limit

    forumLogger.debug('Pagination parameters', { page, limit, offset, sort })

    // Fetch posts with OC information and reply counts
    const postsStartTime = performance.now()

    // For 'latest' sort, we don't need to fetch extra posts
    // For 'hot' sort, we fetch more to allow for sorting by popularity
    const fetchLimit = sort === 'latest' ? limit : limit * 3

    const { data: allPosts, error: fetchError, count } = await supabase
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
      .range(0, fetchLimit - 1)

    let postsWithCounts = await Promise.all(
      (allPosts || []).map(async (post) => {
        const { count: replyCount } = await supabase
          .from('forum_comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id)

        // Calculate popularity score with new post bonus
        // Formula: reply_count * 10 * newness_bonus + time_decay
        // Ultra-new posts get explosive weight to encourage instant interaction
        const postAge = Date.now() - new Date(post.created_at).getTime()
        const minutesSincePost = postAge / (1000 * 60)
        const hoursSincePost = minutesSincePost / 60
        const daysSincePost = hoursSincePost / 24

        // Newness multiplier: ultra-new posts get explosive weight
        let newnessMultiplier = 1.0
        if (minutesSincePost < 5) {
          newnessMultiplier = 20.0 // Posts < 5 min: 20x reply weight
        } else if (minutesSincePost < 15) {
          newnessMultiplier = 15.0 // Posts 5-15 min: 15x reply weight
        } else if (minutesSincePost < 30) {
          newnessMultiplier = 10.0 // Posts 15-30 min: 10x reply weight
        } else if (minutesSincePost < 60) {
          newnessMultiplier = 7.0 // Posts 30-60 min: 7x reply weight
        } else if (hoursSincePost < 3) {
          newnessMultiplier = 5.0 // Posts 1-3 hours: 5x reply weight
        } else if (hoursSincePost < 12) {
          newnessMultiplier = 3.0 // Posts 3-12 hours: 3x reply weight
        } else if (hoursSincePost < 24) {
          newnessMultiplier = 2.0 // Posts 12-24 hours: 2x reply weight
        } else if (daysSincePost < 3) {
          newnessMultiplier = 1.5 // Posts 1-3 days: 1.5x reply weight
        }
        // Posts >= 3 days: 1x reply weight (no bonus)

        const timeBonus = Math.max(0, 30 - daysSincePost) * 0.1 // Posts get bonus for 30 days
        const popularityScore = (replyCount || 0) * 10 * newnessMultiplier + timeBonus

        return {
          ...post,
          reply_count: replyCount || 0,
          popularity_score: popularityScore,
        }
      })
    )

    // Sort based on sort parameter
    if (sort === 'hot') {
      // Sort by popularity score (descending)
      postsWithCounts.sort((a, b) => b.popularity_score - a.popularity_score)
      // Apply pagination after sorting
      postsWithCounts = postsWithCounts.slice(offset, offset + limit)
    }
    // else 'latest' - already sorted by created_at, just apply pagination
    else if (sort === 'latest' && offset > 0) {
      postsWithCounts = postsWithCounts.slice(offset, offset + limit)
    } else if (sort === 'latest') {
      postsWithCounts = postsWithCounts.slice(0, limit)
    }

    const posts = postsWithCounts
    const postsDuration = performance.now() - postsStartTime

    if (fetchError) {
      forumLogger.error('Error fetching posts', fetchError, {
        page,
        limit
      })
      return NextResponse.json(
        { success: false, error: 'Failed to fetch posts' },
        { status: 500 }
      )
    }

    dbLogger.debug('Posts sorted by popularity', {
      postsCount: posts.length,
      totalCount: count,
      duration: Math.round(postsDuration)
    })

    const totalDuration = performance.now() - startTime

    forumLogger.info('Forum posts request completed', {
      postsCount: posts.length,
      totalCount: count,
      page,
      limit,
      totalDuration: Math.round(totalDuration)
    })

    return NextResponse.json({
      success: true,
      data: posts,
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
