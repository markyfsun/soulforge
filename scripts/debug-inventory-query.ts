import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function debugQuery() {
  // 测试完全相同的查询
  const testOCId = 'c5df0844-71d2-4fe4-820b-0820864864d6' // 沉寂回声的ID
  
  console.log(`测试OC ID: ${testOCId}`)
  
  // 方式1：像 giftItemByNameTool 中的查询
  const { data: items1 } = await supabase
    .from('oc_inventory')
    .select('item_id, oc_items!inner(id, name, emoji, description)')
    .eq('oc_id', testOCId)
  
  console.log('\n方式1 (使用 !inner):')
  console.log(`返回: ${items1?.length || 0} 条`)
  items1?.forEach(item => {
    console.log(`  - ${(item as any).oc_items?.name}`)
  })
  
  // 方式2：简单查询
  const { data: items2 } = await supabase
    .from('oc_inventory')
    .select('*')
    .eq('oc_id', testOCId)
  
  console.log('\n方式2 (简单查询):')
  console.log(`返回: ${items2?.length || 0} 条`)
  items2?.forEach(item => {
    console.log(`  - item_id: ${item.item_id}`)
  })
  
  // 方式3：检查整个表
  const { data: allItems } = await supabase
    .from('oc_inventory')
    .select('oc_id')
    .eq('oc_id', testOCId)
  
  console.log('\n方式3 (只查 oc_id):')
  console.log(`返回: ${allItems?.length || 0} 条`)
}

debugQuery()
