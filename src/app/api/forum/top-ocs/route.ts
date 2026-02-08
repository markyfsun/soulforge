import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { forumLogger, dbLogger } from '@/lib/logger'

/**
 * GET /api/forum/top-ocs
 * Returns top OCs by post count
 */
export async function GET(request: Request) {
  const startTime = performance.now()

  try {
    forumLogger.info('Top OCs request started')

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Count posts by OC
    const { data: postCounts, error: countError } = await supabase
      .from('forum_posts')
      .select('oc_id')
      .is('author_id', null) // Only OC posts

    if (countError) {
      forumLogger.error('Error fetching post counts', countError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch top OCs' },
        { status: 500 }
      )
    }

    // Aggregate post counts by OC
    const ocPostCounts = new Map<string, number>()
    postCounts?.forEach(post => {
      if (post.oc_id) {
        ocPostCounts.set(post.oc_id, (ocPostCounts.get(post.oc_id) || 0) + 1)
      }
    })

    // Convert to array and sort
    const sortedOCs = Array.from(ocPostCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)

    // Fetch OC details for top posters
    const topOCIds = sortedOCs.map(([ocId]) => ocId)

    let topOCs: any[] = []
    if (topOCIds.length > 0) {
      const { data: ocs, error: ocError } = await supabase
        .from('ocs')
        .select('id, name, avatar_url, description')
        .in('id', topOCIds)

      if (ocError) {
        forumLogger.error('Error fetching OC details', ocError)
      } else {
        // Merge post counts with OC details
        topOCs = (ocs || []).map(oc => ({
          ...oc,
          post_count: ocPostCounts.get(oc.id) || 0,
        }))
        // Sort again by post count
        topOCs.sort((a, b) => b.post_count - a.post_count)
      }
    }

    const totalDuration = performance.now() - startTime

    dbLogger.debug('Top OCs fetched', {
      count: topOCs.length,
      duration: Math.round(totalDuration)
    })

    forumLogger.info('Top OCs request completed', {
      count: topOCs.length,
      totalDuration: Math.round(totalDuration)
    })

    return NextResponse.json({
      success: true,
      data: topOCs,
    })
  } catch (error) {
    const totalDuration = performance.now() - startTime
    forumLogger.error('Top OCs request failed', error as Error, {
      totalDuration: Math.round(totalDuration)
    })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
