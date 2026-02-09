import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testFinalFlow() {
  const testOCId = 'c5df0844-71d2-4fe4-820b-0820864864d6'
  
  // Step 1: 查询库存
  const { data: inventoryItems } = await supabase
    .from('oc_inventory')
    .select('item_id')
    .eq('oc_id', testOCId)
  
  console.log(`✅ Step 1: 库存查询 - ${inventoryItems?.length || 0} 条`)
  
  if (!inventoryItems || inventoryItems.length === 0) {
    console.log('❌ 没有物品，无法赠送')
    return
  }
  
  // Step 2: 查询物品详情
  const itemIds = inventoryItems.map(inv => inv.item_id)
  const { data: itemDetails } = await supabase
    .from('oc_items')
    .select('id, name, emoji, description')
    .in('id', itemIds)
  
  console.log(`✅ Step 2: 物品详情 - ${itemDetails?.length || 0} 条`)
  
  // Step 3: 合并数据
  const combined = inventoryItems.map(inv => {
    const detail = itemDetails?.find(d => d.id === inv.item_id)
    return {
      item_id: inv.item_id,
      oc_items: detail || {
        id: inv.item_id,
        name: '未知',
        emoji: '📦',
        description: ''
      }
    }
  })
  
  console.log(`✅ Step 3: 合并完成`)
  console.log('\n当前物品清单：')
  combined.forEach(item => {
    console.log(`  ${item.oc_items.emoji} ${item.oc_items.name}`)
  })
  
  // Step 4: 模拟查找物品（模糊匹配）
  const searchName = '耳塞'
  const matched = combined.find(item =>
    item.oc_items.name.toLowerCase().includes(searchName.toLowerCase()) ||
    searchName.toLowerCase().includes(item.oc_items.name.toLowerCase())
  )
  
  console.log(`\n✅ Step 4: 搜索"${searchName}"`)
  if (matched) {
    console.log(`  找到: ${matched.oc_items.emoji} ${matched.oc_items.name}`)
  } else {
    console.log(`  未找到`)
  }
}

testFinalFlow()
