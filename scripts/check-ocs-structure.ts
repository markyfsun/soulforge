import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkOCs() {
  // 检查所有OC
  const { data: ocs, error } = await supabase
    .from('ocs')
    .select('*')
    .limit(5)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('OC 表结构示例：')
  if (ocs.length > 0) {
    console.log(Object.keys(ocs[0]))
    console.log('\n第一个OC的数据：')
    console.log(JSON.stringify(ocs[0], null, 2))
  }

  // 检查总数
  const { count } = await supabase
    .from('ocs')
    .select('*', { count: 'exact', head: true })

  console.log(`\n总共OC数量: ${count}`)
}

checkOCs()
