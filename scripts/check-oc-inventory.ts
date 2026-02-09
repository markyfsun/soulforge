import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkInventory() {
  // 获取所有OC及其物品数量
  const { data: ocs } = await supabase
    .from('ocs')
    .select('id, name')

  const results = []
  
  for (const oc of ocs || []) {
    const { data: inventory } = await supabase
      .from('oc_inventory')
      .select('item_id, oc_items(name)')
      .eq('oc_id', oc.id)
    
    const items = inventory?.map(i => (i as any).oc_items?.name) || []
    
    results.push({
      name: oc.name,
      count: items.length,
      items: items
    })
  }

  // 排序：物品数量从少到多
  results.sort((a, b) => a.count - b.count)

  console.log('\n📦 所有OC的物品清单：\n')
  
  results.forEach(r => {
    if (r.count === 0) {
      console.log(`❌ ${r.name}: 0个物品（没有物品了！）`)
    } else if (r.count <= 2) {
      console.log(`⚠️  ${r.name}: ${r.count}个物品 - ${r.items.join(', ')}`)
    } else {
      console.log(`✅ ${r.name}: ${r.count}个物品`)
    }
  })

  const empty = results.filter(r => r.count === 0)
  if (empty.length > 0) {
    console.log(`\n⚠️  ${empty.length} 个OC没有物品了！`)
    console.log('这些OC无法赠送礼物。')
  }
}

checkInventory()
