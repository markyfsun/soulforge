import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testRLS() {
  // 直接查询 oc_items
  const { data: allItems } = await supabase
    .from('oc_items')
    .select('id, name')
    .limit(5)
  
  console.log('直接查询 oc_items:')
  console.log(`  返回: ${allItems?.length || 0} 条`)
  allItems?.forEach(item => {
    console.log(`  - ${item.name}`)
  })
  
  // 通过 item_id 查询 oc_inventory
  const testItemId = '8fa98db3-3f20-4505-b4fb-c750597390bf'
  
  const { data: invRecord } = await supabase
    .from('oc_inventory')
    .select('*')
    .eq('item_id', testItemId)
    .single()
  
  console.log(`\n查询 item_id=${testItemId} 的库存记录:`)
  console.log(`  oc_id: ${invRecord?.oc_id}`)
  
  // 查询这个 item_id 在 oc_items 表中是否存在
  const { data: itemData } = await supabase
    .from('oc_items')
    .select('*')
    .eq('id', testItemId)
    .single()
  
  console.log(`\n查询 oc_items 中 id=${testItemId}:`)
  if (itemData) {
    console.log(`  ✅ 存在: ${itemData.name}`)
  } else {
    console.log(`  ❌ 不存在！`)
  }
}

testRLS()
