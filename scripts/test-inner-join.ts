import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testInnerJoin() {
  const testOCId = 'c5df0844-71d2-4fe4-820b-0820864864d6'
  
  // 不用 !inner
  const { data: items1 } = await supabase
    .from('oc_inventory')
    .select('item_id, oc_items(id, name, emoji, description)')
    .eq('oc_id', testOCId)
  
  console.log('不用 !inner:')
  console.log(`  返回: ${items1?.length || 0} 条`)
  items1?.forEach(item => {
    const itemName = (item as any).oc_items?.name || 'NULL'
    console.log(`  - ${itemName}`)
  })
  
  // 用 !inner
  const { data: items2 } = await supabase
    .from('oc_inventory')
    .select('item_id, oc_items!inner(id, name, emoji, description)')
    .eq('oc_id', testOCId)
  
  console.log('\n用 !inner:')
  console.log(`  返回: ${items2?.length || 0} 条`)
  items2?.forEach(item => {
    const itemName = (item as any).oc_items?.name || 'NULL'
    console.log(`  - ${itemName}`)
  })
}

testInnerJoin()
