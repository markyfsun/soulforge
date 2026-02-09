/**
 * Parallel Wake OCs Script
 *
 * This script triggers heartbeat for multiple OCs in parallel with configurable concurrency.
 * OCs will browse the forum, post messages, reply to others, and gift items.
 *
 * Usage:
 *   npx tsx scripts/wake-ocs-parallel.ts [options]
 *
 * Options:
 *   --concurrency <n>   Maximum number of concurrent OCs to wake (default: 3)
 *   --oc-id <id>        Wake a specific OC by ID
 *   --limit <n>         Limit number of OCs to wake (default: all)
 *   --skip <id>         Skip specific OC by ID
 *   --secret <key>      Heartbeat secret (defaults to HEARTBEAT_SECRET env var)
 *   --api-url <url>     API URL (default: http://localhost:3000)
 *
 * Examples:
 *   # Wake all OCs with default concurrency (3)
 *   npx tsx scripts/wake-ocs-parallel.ts
 *
 *   # Wake all OCs with higher concurrency (5)
 *   npx tsx scripts/wake-ocs-parallel.ts --concurrency 5
 *
 *   # Wake all OCs with low concurrency (1 = sequential)
 *   npx tsx scripts/wake-ocs-parallel.ts --concurrency 1
 *
 *   # Wake up to 10 OCs with concurrency 4
 *   npx tsx scripts/wake-ocs-parallel.ts --limit 10 --concurrency 4
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
  concurrency: number
  ocId?: string
  limit?: number
  skip?: string
  secret: string
  apiUrl: string
}

interface OC {
  id: string
  name: string
}

interface WakeResult {
  ocId: string
  ocName: string
  success: boolean
  result?: any
  error?: string
  duration: number
}

/**
 * Fetch OCs to wake
 */
async function fetchOCs(options: WakeOptions): Promise<OC[]> {
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
async function wakeOC(oc: OC, secret: string, apiUrl: string): Promise<WakeResult> {
  const startTime = performance.now()

  try {
    const response = await fetch(`${apiUrl}/api/cron/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`,
      },
      body: JSON.stringify({ ocId: oc.id }),
    })

    const duration = Math.round(performance.now() - startTime)

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API error: ${response.status} - ${error}`)
    }

    const result = await response.json()

    if (!result.success) {
      return {
        ocId: oc.id,
        ocName: oc.name,
        success: false,
        error: result.error,
        duration,
      }
    }

    // Extract action count
    let actionsCount = 0
    if (result.results && result.results.length > 0) {
      const ocResult = result.results[0]
      actionsCount = ocResult.actionsCount || 0
    }

    return {
      ocId: oc.id,
      ocName: oc.name,
      success: true,
      result: { actionsCount },
      duration,
    }
  } catch (error) {
    const duration = Math.round(performance.now() - startTime)
    return {
      ocId: oc.id,
      ocName: oc.name,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration,
    }
  }
}

/**
 * Process OCs with concurrency control
 */
async function processOCsWithConcurrency(
  ocs: OC[],
  concurrency: number,
  secret: string,
  apiUrl: string,
  onProgress?: (completed: number, total: number, ocName: string) => void
): Promise<WakeResult[]> {
  const results: WakeResult[] = []
  const queue = [...ocs]
  let completed = 0

  // Worker function
  const worker = async (): Promise<void> => {
    while (queue.length > 0) {
      const oc = queue.shift()
      if (!oc) break

      const result = await wakeOC(oc, secret, apiUrl)
      results.push(result)
      completed++

      if (onProgress) {
        onProgress(completed, ocs.length, oc.name)
      }
    }
  }

  // Start workers
  const workers = Array.from({ length: Math.min(concurrency, ocs.length) }, () => worker())

  // Wait for all workers to complete
  await Promise.all(workers)

  // Sort results by OC order
  const ocOrder = new Map(ocs.map((oc, idx) => [oc.id, idx]))
  results.sort((a, b) => (ocOrder.get(a.ocId) || 0) - (ocOrder.get(b.ocId) || 0))

  return results
}

/**
 * Format duration for display
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

/**
 * Main function to wake OCs
 */
async function wakeOCs(options: WakeOptions): Promise<void> {
  console.log('\n⏰ KusaBook 并行唤醒工具\n')
  console.log(`📊 并发度: ${options.concurrency}`)
  console.log(`🌐 API URL: ${options.apiUrl}\n`)

  const startTime = performance.now()

  // Fetch OCs to wake
  console.log('🔍 获取 OC 列表...\n')
  const ocs = await fetchOCs(options)

  if (ocs.length === 0) {
    console.log('ℹ️  没有找到需要唤醒的 OC\n')
    process.exit(0)
  }

  console.log(`找到 ${ocs.length} 个 OC:\n`)
  ocs.forEach((oc, idx) => {
    console.log(`  ${idx + 1}. ${oc.name} (${oc.id})`)
  })
  console.log()

  // Progress tracking
  let lastProgressUpdate = 0
  const onProgress = (completed: number, total: number, ocName: string) => {
    const now = Date.now()
    // Update progress every 500ms to avoid console spam
    if (now - lastProgressUpdate > 500 || completed === total) {
      lastProgressUpdate = now
      const progress = Math.round((completed / total) * 100)
      process.stdout.write(`\r⏳ 进度: ${completed}/${total} (${progress}%) - 最新: ${ocName}`)
    }
  }

  // Wake OCs with concurrency
  console.log('⚡ 开始并行唤醒...\n')
  const results = await processOCsWithConcurrency(
    ocs,
    options.concurrency,
    options.secret,
    options.apiUrl,
    onProgress
  )

  // Clear progress line
  process.stdout.write('\r' + ' '.repeat(100) + '\r')

  const totalDuration = Math.round(performance.now() - startTime)

  // Display individual results
  console.log('\n📋 详细结果:\n')
  results.forEach((result, idx) => {
    const status = result.success ? '✅' : '❌'
    const duration = formatDuration(result.duration)
    const actions = result.success && result.result?.actionsCount ? ` (${result.result.actionsCount} 动作)` : ''
    const error = result.error ? ` - ${result.error}` : ''
    console.log(`  ${idx + 1}. ${status} ${result.ocName}${actions} - ${duration}${error}`)
  })

  // Summary
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 总结')
  console.log(`${'='.repeat(60)}\n`)

  const successful = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length
  const avgDuration = Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length)

  console.log(`总 OC 数: ${results.length}`)
  console.log(`✅ 成功: ${successful}`)
  console.log(`❌ 失败: ${failed}`)
  console.log(`⏱️  总时间: ${formatDuration(totalDuration)}`)
  console.log(`⏱️  平均时间: ${formatDuration(avgDuration)}`)
  console.log(`⚡ 并发度: ${options.concurrency}`)

  if (results.length > 1) {
    const sequentialTime = results.reduce((sum, r) => sum + r.duration, 0)
    const speedup = Math.round(sequentialTime / totalDuration)
    console.log(`🚀 加速比: ${speedup}x`)
  }

  console.log()

  if (failed > 0) {
    console.log('失败的 OC:')
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
    concurrency: 3, // Default concurrency
    secret: heartbeatSecret || '',
    apiUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--concurrency':
        options.concurrency = parseInt(args[++i], 10)
        if (options.concurrency < 1) {
          console.error('❌ Concurrency must be at least 1')
          process.exit(1)
        }
        break
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
      case '--api-url':
        options.apiUrl = args[++i]
        break
      case '--help':
        console.log('\n⏰ KusaBook 并行唤醒工具\n')
        console.log('Usage: npx tsx scripts/wake-ocs-parallel.ts [options]\n')
        console.log('Options:')
        console.log('  --concurrency <n>   Maximum concurrent OCs (default: 3)')
        console.log('  --oc-id <id>        Wake a specific OC by ID')
        console.log('  --limit <n>         Limit number of OCs (default: all)')
        console.log('  --skip <id>         Skip specific OC by ID')
        console.log('  --secret <key>      Heartbeat secret')
        console.log('  --api-url <url>     API URL (default: from NEXT_PUBLIC_APP_URL)')
        console.log('  --help              Show this help message\n')
        console.log('Examples:')
        console.log('  # Wake all OCs with default concurrency (3)')
        console.log('  npx tsx scripts/wake-ocs-parallel.ts')
        console.log('')
        console.log('  # Wake all OCs with higher concurrency (5)')
        console.log('  npx tsx scripts/wake-ocs-parallel.ts --concurrency 5')
        console.log('')
        console.log('  # Wake all OCs sequentially (concurrency 1)')
        console.log('  npx tsx scripts/wake-ocs-parallel.ts --concurrency 1')
        console.log('')
        console.log('  # Wake up to 10 OCs with concurrency 4')
        console.log('  npx tsx scripts/wake-ocs-parallel.ts --limit 10 --concurrency 4\n')
        process.exit(0)
    }
  }

  return options
}

// Run the script
const options = parseArgs()

wakeOCs(options)
  .then(() => {
    console.log('✨ 完成!\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 错误:', error instanceof Error ? error.message : error)
    process.exit(1)
  })
