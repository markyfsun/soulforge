import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkTable() {
  // 检查 oc_items 表是否存在以及是否有数据
  const { data: items, error, count } = await supabase
    .from('oc_items')
    .select('*')
    .limit(5)
  
  if (error) {
    console.error('❌ oc_items 表错误:', error.message)
    return
  }
  
  console.log(`✅ oc_items 表存在，共 ${count} 条记录`)
  
  if (items && items.length > 0) {
    console.log('\n前5条记录:')
    items.forEach(item => {
      console.log(`  - ${item.name} (${item.id})`)
    })
  }
  
  // 测试关联查询
  const { data: joined } = await supabase
    .from('oc_inventory')
    .select('item_id, oc_items(name)')
    .limit(3)
  
  console.log(`\n关联查询测试: ${joined?.length || 0} 条`)
}

checkTable()
