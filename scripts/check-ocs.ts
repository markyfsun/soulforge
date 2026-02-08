import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkOCs() {
  console.log('\n📊 检查 OC 和物品数据\n')
  
  // 获取所有 OC
  const { data: ocs, error: ocsError } = await supabase
    .from('ocs')
    .select('id, name, avatar_url')
    .order('created_at', { ascending: true })
  
  if (ocsError) {
    console.error('❌ 获取 OC 失败:', ocsError)
    return
  }
  
  console.log(`找到 ${ocs.length} 个 OC:\n`)
  
  for (const oc of ocs) {
    console.log(`${'='.repeat(60)}`)
    console.log(`🎭 ${oc.name}`)
    console.log(`   ID: ${oc.id}`)
    console.log(`   头像: ${oc.avatar_url}`)
    
    // 获取该 OC 的物品
    const { data: inventory } = await supabase
      .from('oc_inventory')
      .select('item_id, oc_items(*)')
      .eq('oc_id', oc.id)
    
    if (inventory && inventory.length > 0) {
      console.log(`   🎁 物品 (${inventory.length}个):`)
      inventory.forEach((inv: any, idx: number) => {
        const item = inv.oc_items
        console.log(`     ${idx + 1}. ${item.name} (${item.rarity})`)
        console.log(`        图片: ${item.image_url ? '✅ 有图' : '❌ 无图'}`)
      })
    } else {
      console.log(`   🎁 物品: ❌ 无`)
    }
    console.log()
  }
  
  // 统计
  const { count: totalItems } = await supabase
    .from('oc_items')
    .select('*', { count: 'exact', head: true })
  
  const { count: totalInventory } = await supabase
    .from('oc_inventory')
    .select('*', { count: 'exact', head: true })
  
  console.log(`${'='.repeat(60)}`)
  console.log('📊 总计:')
  console.log(`   OC 数量: ${ocs.length}`)
  console.log(`   物品种类: ${totalItems}`)
  console.log(`   库存总数: ${totalInventory}`)
  console.log()
}

checkOCs().then(() => process.exit(0))
