/**
 * Clear All Data Script
 *
 * This script deletes all data from the SoulForge database except for user profiles.
 * Use this to reset the application state for testing or development.
 *
 * WARNING: This operation is irreversible!
 *
 * Usage:
 *   npx tsx scripts/clear-all-data.ts [--confirm]
 *
 * Options:
 *   --confirm  Skip the confirmation prompt
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Deletes all data from the specified table
 */
async function deleteTable(tableName: string): Promise<void> {
  const startTime = performance.now()

  const { error } = await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const duration = Math.round(performance.now() - startTime)

  if (error) {
    console.error(`  ❌ Error deleting ${tableName}:`, error.message)
    throw error
  }

  console.log(`  ✅ Cleared ${tableName} (${duration}ms)`)
}

/**
 * Main function to clear all data
 */
async function clearAllData(confirm: boolean): Promise<void> {
  console.log('\n🗑️  SoulForge Data Clear Utility\n')
  console.log('⚠️  This will delete ALL data except user profiles!')
  console.log('Affected tables:')
  console.log('  - forum_comments')
  console.log('  - forum_posts')
  console.log('  - messages')
  console.log('  - conversations')
  console.log('  - memories')
  console.log('  - relationships')
  console.log('  - oc_inventory')
  console.log('  - oc_items')
  console.log('  - ocs')
  console.log('  - world_events')
  console.log('  - heartbeat_log\n')

  if (!confirm) {
    // Read from stdin to confirm
    process.stdout.write('Type "DELETE" to confirm: ')
    const input = await new Promise<string>((resolve) => {
      process.stdin.once('data', (data) => resolve(data.toString().trim()))
    })

    if (input !== 'DELETE') {
      console.log('❌ Operation cancelled')
      process.exit(0)
    }
  }

  console.log('\n🚀 Starting data clear...\n')

  const startTime = performance.now()

  // Delete in order of dependencies (foreign key constraints)
  const tables = [
    'forum_comments',
    'forum_posts',
    'messages',
    'conversations',
    'memories',
    'relationships',
    'oc_inventory',
    'oc_items',
    'ocs',
    'world_events',
    'heartbeat_log',
  ]

  for (const table of tables) {
    try {
      await deleteTable(table)
    } catch (error) {
      console.error(`\n❌ Failed to clear ${table}`)
      console.error('Stopping operation to prevent partial state')
      process.exit(1)
    }
  }

  const totalDuration = Math.round(performance.now() - startTime)

  console.log(`\n✅ Successfully cleared all data in ${totalDuration}ms\n`)

  // Verify data is cleared
  console.log('🔍 Verification:')
  for (const table of ['ocs', 'forum_posts', 'conversations']) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    if (error) {
      console.log(`  ⚠️  Could not verify ${table}`)
    } else {
      console.log(`  ✅ ${table}: ${count} rows remaining`)
    }
  }
  console.log()
}

// Parse command line arguments
const args = process.argv.slice(2)
const confirmFlag = args.includes('--confirm')

// Run the script
clearAllData(confirmFlag)
  .then(() => {
    console.log('✨ Done!\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  })
