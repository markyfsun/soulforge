import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function debug() {
  const testOCId = 'c5df0844-71d2-4fe4-820b-0820864864d6'
  
  // Step 1: 查询库存
  const { data: inventoryItems } = await supabase
    .from('oc_inventory')
    .select('item_id')
    .eq('oc_id', testOCId)
  
  console.log('Inventory items:', inventoryItems)
  console.log('Item IDs:', inventoryItems?.map(i => i.item_id))
  
  if (!inventoryItems || inventoryItems.length === 0) {
    console.log('No inventory items')
    return
  }
  
  const itemIds = inventoryItems.map(inv => inv.item_id)
  console.log('\nSearching for items with IDs:', itemIds)
  
  // Step 2: 查询物品详情 - 测试不同的查询方式
  console.log('\n--- Test 1: .in() with array ---')
  const { data: items1, error: error1 } = await supabase
    .from('oc_items')
    .select('id, name')
    .in('id', itemIds)
  
  console.log(`  Result: ${items1?.length || 0} items`)
  console.log(`  Error: ${error1?.message || 'none'}`)
  items1?.forEach(i => console.log(`    - ${i.name}`))
  
  console.log('\n--- Test 2: Direct .eq() for first ID ---')
  const { data: items2, error: error2 } = await supabase
    .from('oc_items')
    .select('id, name')
    .eq('id', itemIds[0])
  
  console.log(`  Result: ${items2?.length || 0} items`)
  console.log(`  Error: ${error2?.message || 'none'}`)
  items2?.forEach(i => console.log(`    - ${i.name}`))
}

debug()
