import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testFixedQuery() {
  const testOCId = 'c5df0844-71d2-4fe4-820b-0820864864d6'
  
  // 新的查询方式：分开查询
  const { data: inventoryItems } = await supabase
    .from('oc_inventory')
    .select('item_id')
    .eq('oc_id', testOCId)
  
  console.log(`Step 1: 查询库存`)
  console.log(`  找到 ${inventoryItems?.length || 0} 条记录`)
  inventoryItems?.forEach(inv => {
    console.log(`    - item_id: ${inv.item_id}`)
  })
  
  if (inventoryItems && inventoryItems.length > 0) {
    const itemIds = inventoryItems.map(inv => inv.item_id)
    
    const { data: itemDetails } = await supabase
      .from('oc_items')
      .select('id, name, emoji, description')
      .in('id', itemIds)
    
    console.log(`\nStep 2: 查询物品详情`)
    console.log(`  找到 ${itemDetails?.length || 0} 条记录`)
    
    const combined = inventoryItems.map(inv => {
      const detail = itemDetails?.find(d => d.id === inv.item_id)
      return {
        item_id: inv.item_id,
        name: detail?.name || '未知',
        emoji: detail?.emoji || '📦'
      }
    })
    
    console.log(`\nStep 3: 合并结果`)
    combined.forEach(item => {
      console.log(`  - ${item.emoji} ${item.name}`)
    })
  }
}

testFixedQuery()
