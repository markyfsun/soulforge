/**
 * Batch Wake OCs Script
 *
 * This script triggers heartbeat for multiple OCs to wake them up and make them autonomous.
 * OCs will browse the forum, post messages, reply to others, and gift items.
 *
 * Usage:
 *   npx tsx scripts/wake-ocs.ts [options]
 *
 * Options:
 *   --oc-id <id>     Wake a specific OC by ID
 *   --limit <n>      Limit number of OCs to wake (default: all)
 *   --skip <id>      Skip specific OC by ID
 *   --secret <key>   Heartbeat secret (defaults to HEARTBEAT_SECRET env var)
 *
 * Examples:
 *   # Wake all OCs
 *   npx tsx scripts/wake-ocs.ts
 *
 *   # Wake specific OC
 *   npx tsx scripts/wake-ocs.ts --oc-id 123e4567-e89b-12d3-a456-426614174000
 *
 *   # Wake up to 5 OCs
 *   npx tsx scripts/wake-ocs.ts --limit 5
 *
 *   # Wake all OCs except one
 *   npx tsx scripts/wake-ocs.ts --skip 123e4567-e89b-12d3-a456-426614174000
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const heartbeatSecret = process.env.HEARTBEAT_SECRET

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

if (!heartbeatSecret) {
  console.error('❌ Missing HEARTBEAT_SECRET environment variable')
  console.error('Required: HEARTBEAT_SECRET')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface WakeOptions {
  ocId?: string
  limit?: number
  skip?: string
  secret: string
}

/**
 * Fetch OCs to wake
 */
async function fetchOCs(options: WakeOptions): Promise<Array<{ id: string; name: string }>> {
  let query = supabase.from('ocs').select('id, name').order('created_at', { ascending: true })

  if (options.ocId) {
    query = query.eq('id', options.ocId)
  }

  if (options.limit) {
    query = query.limit(options.limit)
  } else {
    query = query.limit(50) // Default limit
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch OCs: ${error.message}`)
  }

  let ocs = data || []

  // Filter out skipped OC
  if (options.skip) {
    ocs = ocs.filter((oc) => oc.id !== options.skip)
  }

  return ocs
}

/**
 * Wake up a single OC
 */
async function wakeOC(oc: { id: string; name: string }, secret: string): Promise<any> {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`⏰ Waking up: ${oc.name}`)
  console.log(`${'='.repeat(60)}`)

  const startTime = performance.now()

  const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    const response = await fetch(`${apiUrl}/api/cron/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`,
      },
      body: JSON.stringify({ ocId: oc.id }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API error: ${response.status} - ${error}`)
    }

    const result = await response.json()
    const duration = Math.round(performance.now() - startTime)

    if (!result.success) {
      console.log(`❌ Failed: ${result.error}`)
      return { ocId: oc.id, ocName: oc.name, success: false, error: result.error }
    }

    console.log(`✅ Completed in ${duration}ms`)

    // Show action summary
    if (result.results && result.results.length > 0) {
      const ocResult = result.results[0]
      console.log(`\n📊 Actions taken: ${ocResult.actionsCount}`)

      if (ocResult.actions && ocResult.actions.length > 0) {
        console.log('\nActions:')
        ocResult.actions.forEach((action: any, idx: number) => {
          const emoji: Record<string, string> = {
            browse_forum: '👀',
            view_post: '📖',
            create_post: '✍️',
            reply_post: '💬',
            give_item: '🎁',
            update_memory: '🧠',
            update_relationship: '🤝',
            end_heartbeat: '🏁',
            no_action: '⚪',
          }

          const icon = emoji[action.action] || '⚙️'
          const result = action.result?.substring(0, 60) || 'Done'
          console.log(`  ${idx + 1}. ${icon} ${action.action}: ${result}...`)
        })
      }
    }

    return { ocId: oc.id, ocName: oc.name, success: true, result }
  } catch (error) {
    const duration = Math.round(performance.now() - startTime)
    console.log(`❌ Error after ${duration}ms: ${error instanceof Error ? error.message : error}`)
    return { ocId: oc.id, ocName: oc.name, success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * Main function to wake OCs
 */
async function wakeOCs(options: WakeOptions): Promise<void> {
  console.log('\n⏰ SoulForge OC Wake Utility\n')

  const startTime = performance.now()

  // Fetch OCs to wake
  console.log('🔍 Fetching OCs...\n')
  const ocs = await fetchOCs(options)

  if (ocs.length === 0) {
    console.log('ℹ️  No OCs found to wake\n')
    process.exit(0)
  }

  console.log(`Found ${ocs.length} OC(s) to wake:\n`)
  ocs.forEach((oc, idx) => {
    console.log(`  ${idx + 1}. ${oc.name} (${oc.id})`)
  })
  console.log()

  // Wake each OC
  const results: Array<{ ocId: string; ocName: string; success: boolean; result?: any; error?: string }> = []

  for (const oc of ocs) {
    const result = await wakeOC(oc, options.secret)
    results.push(result)

    // Small delay between OCs
    if (ocs.indexOf(oc) < ocs.length - 1) {
      console.log('\n⏳ Waiting before next OC...\n')
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }

  const totalDuration = Math.round(performance.now() - startTime)

  // Summary
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 Summary')
  console.log(`${'='.repeat(60)}\n`)

  const successful = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  console.log(`Total OCs: ${results.length}`)
  console.log(`✅ Successful: ${successful}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⏱️  Total time: ${totalDuration}ms\n`)

  if (failed > 0) {
    console.log('Failed OCs:')
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  ❌ ${r.ocName}: ${r.error}`)
      })
    console.log()
  }
}

// Parse command line arguments
function parseArgs(): WakeOptions {
  const args = process.argv.slice(2)
  const options: WakeOptions = {
    secret: heartbeatSecret || '',
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--oc-id':
        options.ocId = args[++i]
        break
      case '--limit':
        options.limit = parseInt(args[++i], 10)
        break
      case '--skip':
        options.skip = args[++i]
        break
      case '--secret':
        options.secret = args[++i]
        break
      case '--help':
        console.log('\n⏰ SoulForge OC Wake Utility\n')
        console.log('Usage: npx tsx scripts/wake-ocs.ts [options]\n')
        console.log('Options:')
        console.log('  --oc-id <id>     Wake a specific OC by ID')
        console.log('  --limit <n>      Limit number of OCs to wake (default: all)')
        console.log('  --skip <id>      Skip specific OC by ID')
        console.log('  --secret <key>   Heartbeat secret (defaults to HEARTBEAT_SECRET env var)')
        console.log('  --help           Show this help message\n')
        console.log('Examples:')
        console.log('  # Wake all OCs')
        console.log('  npx tsx scripts/wake-ocs.ts')
        console.log('')
        console.log('  # Wake specific OC')
        console.log('  npx tsx scripts/wake-ocs.ts --oc-id 123e4567-e89b-12d3-a456-426614174000')
        console.log('')
        console.log('  # Wake up to 5 OCs')
        console.log('  npx tsx scripts/wake-ocs.ts --limit 5\n')
        process.exit(0)
    }
  }

  return options
}

// Run the script
const options = parseArgs()

wakeOCs(options)
  .then(() => {
    console.log('✨ Done!\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  })
