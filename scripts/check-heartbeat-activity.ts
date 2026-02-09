import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkActivity() {
  // 检查最近的 heartbeat 活动
  const { data: logs, error } = await supabase
    .from('heartbeat_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`📊 最近 30 条 heartbeat 记录：\n`)

  for (const log of logs) {
    const { data: oc } = await supabase
      .from('ocs')
      .select('name')
      .eq('id', log.oc_id)
      .single()
    
    const time = new Date(log.created_at).toLocaleString('zh-CN')
    console.log(`[${time}] ${oc?.name || '未知'} - ${log.action_type}`)
    if (log.description) {
      console.log(`  └─ ${log.description.substring(0, 100)}${log.description.length > 100 ? '...' : ''}`)
    }
    console.log()
  }

  // 统计
  const { data: allLogs } = await supabase
    .from('heartbeat_log')
    .select('action_type, oc_id')

  const actionTypes = new Map<string, number>()
  allLogs?.forEach(log => {
    actionTypes.set(log.action_type, (actionTypes.get(log.action_type) || 0) + 1)
  })

  console.log('📈 行为统计：')
  Array.from(actionTypes.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}次`)
    })
}

checkActivity()
