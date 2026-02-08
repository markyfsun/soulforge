import { createClient } from '@/lib/supabase/server'
import { WorldEvent } from '@/types/database'
import { chatLogger } from './logger'

/**
 * Configuration for world events fetching
 */
const DEFAULT_EVENTS_LIMIT = 10
const MAX_EVENTS_LIMIT = 50

/**
 * Event type categories for relevance filtering
 * Some events are more globally relevant than others
 */
const EVENT_TYPE_PRIORITY: Record<string, number> = {
  oc_summoned: 8, // High priority - new OC joining
  major_event: 10, // Highest priority - significant world events
  item_gifted: 6, // Medium-high - social interactions
  relationship_changed: 5, // Medium - relationship changes
  heartbeat: 2, // Low priority - routine autonomous actions
}

/**
 * Fetches recent world events relevant to the chat context
 *
 * World events are global events that affect all OCs. This function
 * fetches the most recent events and prioritizes them by relevance.
 *
 * @param ocId - The OC's ID (for context, not direct filtering since events are global)
 * @param limit - Maximum number of events to return (default: 10, max: 50)
 * @returns Array of recent world events, sorted by relevance and recency
 */
export async function getRecentWorldEvents(
  ocId: string,
  limit: number = DEFAULT_EVENTS_LIMIT
): Promise<WorldEvent[]> {
  const startTime = performance.now()
  const safeLimit = Math.min(Math.max(1, limit), MAX_EVENTS_LIMIT)

  try {
    const supabase = await createClient()

    // Fetch recent world events, prioritized by event type and recency
    const fetchStartTime = performance.now()
    const { data: events, error } = await supabase
      .from('world_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(safeLimit * 2) // Fetch extra to allow for filtering
    const fetchDuration = performance.now() - fetchStartTime

    if (error) {
      chatLogger.warn('Failed to fetch world events', {
        ocId,
        error: error.message,
        duration: Math.round(fetchDuration)
      })
      return []
    }

    if (!events || events.length === 0) {
      chatLogger.debug('No world events found', { ocId })
      return []
    }

    // Score and sort events by relevance
    const scoredEvents = events.map((event) => ({
      event,
      score: EVENT_TYPE_PRIORITY[event.event_type] || 3, // Default priority for unknown types
    }))

    // Sort by score (descending), then by date (descending)
    scoredEvents.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score
      }
      return (
        new Date(b.event.created_at).getTime() -
        new Date(a.event.created_at).getTime()
      )
    })

    // Return top N events
    const result = scoredEvents.slice(0, safeLimit).map((item) => item.event)

    const totalDuration = performance.now() - startTime
    chatLogger.debug('World events fetched successfully', {
      ocId,
      eventCount: result.length,
      fetchedCount: events.length,
      duration: Math.round(totalDuration),
      fetchDuration: Math.round(fetchDuration)
    })

    return result
  } catch (error) {
    const totalDuration = performance.now() - startTime
    chatLogger.error('Error fetching world events', error as Error, {
      ocId,
      duration: Math.round(totalDuration)
    })
    return []
  }
}

/**
 * Formats world events for inclusion in AI prompts
 *
 * This function transforms raw world event data into natural language
 * descriptions that can be easily understood by an AI model.
 *
 * @param events - Array of world events to format
 * @returns Array of formatted event descriptions
 */
export function formatWorldEventsForPrompt(events: WorldEvent[]): string[] {
  if (!events || events.length === 0) {
    return []
  }

  return events.map((event) => {
    const timeAgo = getTimeAgo(event.created_at)

    // Format based on event type
    switch (event.event_type) {
      case 'oc_summoned':
        return `[${timeAgo}] ${event.description}`

      case 'item_gifted':
        const metadata = event.metadata as Record<string, unknown> | null
        if (metadata?.from_oc && metadata.to_oc) {
          return `[${timeAgo}] ${event.description}`
        }
        return `[${timeAgo}] An item was gifted between OCs`

      case 'relationship_changed':
        return `[${timeAgo}] ${event.description}`

      case 'major_event':
        return `[${timeAgo}] MAJOR: ${event.description}`

      case 'heartbeat':
        // Heartbeat events are less important, simplify format
        return `[${timeAgo}] ${event.description}`

      default:
        // Unknown event type, use generic description
        return `[${timeAgo}] ${event.description}`
    }
  })
}

/**
 * Helper function to get relative time string
 *
 * @param dateString - ISO date string
 * @returns Human-readable relative time (e.g., "2 hours ago")
 */
function getTimeAgo(dateString: string): string {
  const now = new Date()
  const past = new Date(dateString)
  const diffMs = now.getTime() - past.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMinutes < 1) {
    return 'just now'
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  } else {
    // For older events, just show the date
    return past.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }
}

/**
 * Enhanced version that returns both formatted and raw events
 * Useful for debugging or when you need access to metadata
 */
export async function getWorldEventsWithContext(
  ocId: string,
  limit: number = DEFAULT_EVENTS_LIMIT
): Promise<{
  events: WorldEvent[]
  formatted: string[]
  summary: string
}> {
  const events = await getRecentWorldEvents(ocId, limit)
  const formatted = formatWorldEventsForPrompt(events)

  // Create a brief summary
  const summary = buildEventsSummary(events)

  return {
    events,
    formatted,
    summary,
  }
}

/**
 * Builds a concise summary of world events
 *
 * @param events - Array of world events
 * @returns A brief summary string
 */
function buildEventsSummary(events: WorldEvent[]): string {
  if (!events || events.length === 0) {
    return 'No recent world events.'
  }

  const eventTypeCounts = events.reduce((acc, event) => {
    acc[event.event_type] = (acc[event.event_type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const summaryParts: string[] = []

  if (eventTypeCounts.major_event > 0) {
    summaryParts.push(`${eventTypeCounts.major_event} major event${eventTypeCounts.major_event > 1 ? 's' : ''}`)
  }
  if (eventTypeCounts.oc_summoned > 0) {
    summaryParts.push(`${eventTypeCounts.oc_summoned} new OC${eventTypeCounts.oc_summoned > 1 ? 's' : ''} joined`)
  }
  if (eventTypeCounts.item_gifted > 0) {
    summaryParts.push(`${eventTypeCounts.item_gifted} item${eventTypeCounts.item_gifted > 1 ? 's were' : ' was'} gifted`)
  }
  if (eventTypeCounts.relationship_changed > 0) {
    summaryParts.push(`${eventTypeCounts.relationship_changed} relationship change${eventTypeCounts.relationship_changed > 1 ? 's' : ''}`)
  }

  if (summaryParts.length === 0) {
    return `${events.length} recent event${events.length > 1 ? 's' : ''}`
  }

  return summaryParts.join(', ')
}
