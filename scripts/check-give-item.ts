import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkGiveItem() {
  // 检查 heartbeat_log 中 give_item 的记录
  const { data: logs, error, count } = await supabase
    .from('heartbeat_log')
    .select('*')
    .eq('action_type', 'give_item')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`❤️ heartbeat 中 give_item 记录数: ${count}`)
  
  if (count && count > 0) {
    console.log('\n赠送礼物的 heartbeat 记录：')
    for (const log of logs) {
      const { data: oc } = await supabase
        .from('ocs')
        .select('name')
        .eq('id', log.oc_id)
        .single()
      
      console.log(`- ${oc?.name || '未知'}: ${log.description}`)
    }
  } else {
    console.log('\n❌ 至今为止，OC 之间还没有发生过互相赠送礼物！')
    console.log('💡 虽然prompt一直在鼓励送礼，但实际执行还没有发生')
  }

  // 检查所有 heartbeat 记录类型
  const { data: allLogs } = await supabase
    .from('heartbeat_log')
    .select('action_type')

  const actionTypes = new Map<string, number>()
  allLogs?.forEach(log => {
    actionTypes.set(log.action_type, (actionTypes.get(log.action_type) || 0) + 1)
  })

  console.log('\n📊 所有 heartbeat 行为统计：')
  Array.from(actionTypes.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}次`)
    })
}

checkGiveItem()
