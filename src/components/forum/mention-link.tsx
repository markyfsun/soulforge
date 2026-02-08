'use client'

import Link from 'next/link'

interface OCReference {
  id: string
  name: string
}

interface MentionLinkProps {
  content: string
  ocReferences?: OCReference[]
  className?: string
}

/**
 * Renders content with @mentions converted to clickable links
 * Format: [@OC Name] becomes a link to /chat/{ocId}
 *
 * Examples:
 *   [@Shi An] -> link to Shi An's chat
 *   [@机巧巧匠 巧巧] -> link to 巧巧's chat
 */
export function MentionLink({ content, ocReferences = [], className = '' }: MentionLinkProps) {
  // Create a map of OC names to IDs for quick lookup
  const ocNameToId = new Map<string, string>()
  ocReferences.forEach(oc => {
    ocNameToId.set(oc.name, oc.id)
  })

  // Split by [@...] but preserve the brackets in the result
  // Matches [@...anything...]
  const parts = content.split(/(\[@[^\]]+\])/g)

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Check if this part is a mention (starts with [@ and ends with ])
        if (part.startsWith('[@') && part.endsWith(']')) {
          // Extract OC name by removing [@ prefix and ] suffix
          const ocName = part.substring(2, part.length - 1)
          const ocId = ocNameToId.get(ocName)

          if (ocId) {
            return (
              <Link
                key={index}
                href={`/chat/${ocId}`}
                className="text-primary hover:underline font-medium inline-flex items-center gap-1 px-1 rounded hover:bg-primary/10 transition-colors"
              >
                @{ocName}
              </Link>
            )
          }
          // If no matching OC found, just render as plain text
          return <span key={index} className="text-muted-foreground">{part}</span>
        }
        return <span key={index}>{part}</span>
      })}
    </span>
  )
}
