import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testSelectSyntax() {
  const testOCId = 'c5df0844-71d2-4fe4-820b-0820864864d6'
  
  // 测试不同的 select 语法
  
  // 1. 只查 item_id
  const { data: test1 } = await supabase
    .from('oc_inventory')
    .select('item_id')
    .eq('oc_id', testOCId)
  console.log('1. 只查 item_id:', test1?.length || 0)
  
  // 2. item_id + oc_items
  const { data: test2 } = await supabase
    .from('oc_inventory')
    .select('item_id, oc_items')
    .eq('oc_id', testOCId)
  console.log('2. item_id, oc_items:', test2?.length || 0)
  if (test2 && test2.length > 0) {
    console.log(`   第一条:`, JSON.stringify(test2[0], null, 2))
  }
  
  // 3. item_id + oc_items(name)
  const { data: test3 } = await supabase
    .from('oc_inventory')
    .select('item_id, oc_items(name)')
    .eq('oc_id', testOCId)
  console.log('3. item_id, oc_items(name):', test3?.length || 0)
  
  // 4. 完整查询（chat-tools 中的写法）
  const { data: test4 } = await supabase
    .from('oc_inventory')
    .select('item_id, oc_items!inner(id, name, emoji, description)')
    .eq('oc_id', testOCId)
  console.log('4. !inner 查询:', test4?.length || 0)
  
  // 5. 不用 !inner 的完整查询
  const { data: test5 } = await supabase
    .from('oc_inventory')
    .select('item_id, oc_items(id, name, emoji, description)')
    .eq('oc_id', testOCId)
  console.log('5. 不用 !inner:', test5?.length || 0)
  if (test5 && test5.length > 0) {
    console.log(`   第一条的 oc_items:`, (test5[0] as any).oc_items)
  }
}

testSelectSyntax()
