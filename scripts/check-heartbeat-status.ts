import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkStatus() {
  // 检查OC状态
  const { data: ocs, error } = await supabase
    .from('ocs')
    .select('id, name, last_heartbeat, is_awake')
    .order('last_heartbeat', { ascending: false })

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`🤖 当前有 ${ocs.length} 个 OC\n`)

  const awake = ocs.filter(oc => oc.is_awake)
  console.log(`✅ 已唤醒: ${awake.length} 个`)
  console.log(`❌ 未唤醒: ${ocs.length - awake.length} 个\n`)

  console.log('最近的 heartbeat 时间：')
  for (const oc of ocs.slice(0, 10)) {
    const lastTime = oc.last_heartbeat ? new Date(oc.last_heartbeat).toLocaleString('zh-CN') : '从未'
    const status = oc.is_awake ? '✅' : '❌'
    console.log(`  ${status} ${oc.name}: ${lastTime}`)
  }
}

checkStatus()
