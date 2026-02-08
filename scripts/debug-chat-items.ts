import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugChatItems() {
  console.log('\n🔍 调试聊天物品数据\n')
  
  // 获取第一个 OC
  const { data: ocs } = await supabase
    .from('ocs')
    .select('id, name')
    .limit(1)
  
  if (!ocs || ocs.length === 0) {
    console.log('❌ 没有找到 OC')
    return
  }
  
  const oc = ocs[0]
  console.log(`📝 检查 OC: ${oc.name} (${oc.id})\n`)
  
  // 1. 检查 conversation
  console.log('1️⃣ 检查 conversation:')
  const { data: conversations } = await supabase
    .from('conversations')
    .select('*')
    .eq('oc_id', oc.id)
  
  if (!conversations || conversations.length === 0) {
    console.log('   ⚠️  没有 conversation（这是正常的，第一次聊天时创建）')
    console.log('   页面会显示空物品列表: items = []\n')
  } else {
    console.log(`   ✅ 找到 ${conversations.length} 个 conversation\n`)
  }
  
  // 2. 检查 inventory（不管有没有 conversation）
  console.log('2️⃣ 检查 inventory:')
  const { data: inventory, error: invError } = await supabase
    .from('oc_inventory')
    .select('item_id, oc_items(*)')
    .eq('oc_id', oc.id)
  
  if (invError) {
    console.log(`   ❌ 查询失败: ${invError.message}`)
    console.log(`   错误详情:`, invError)
  } else {
    console.log(`   ✅ 找到 ${inventory?.length || 0} 个库存项`)
    
    if (inventory && inventory.length > 0) {
      inventory.forEach((inv: any, idx: number) => {
        const item = inv.oc_items
        console.log(`     ${idx + 1}. ${item?.name || '未知'} (${item?.rarity || '无稀有度'})`)
        console.log(`        图片: ${item?.image_url || '无图片'}`)
      })
    }
  }
  
  // 3. 检查 oc_items 表
  console.log('\n3️⃣ 检查所有 oc_items:')
  const { data: allItems } = await supabase
    .from('oc_items')
    .select('id, name, rarity, image_url')
    .limit(5)
  
  console.log(`   总共 ${allItems?.length || 0} 个物品`)
  if (allItems) {
    allItems.forEach((item: any, idx: number) => {
      console.log(`     ${idx + 1}. ${item.name} - 图片: ${item.image_url ? '✅' : '❌'}`)
    })
  }
  
  console.log('\n💡 可能的问题:')
  console.log('   1. 前端查询时可能没有 conversation，导致 items = []')
  console.log('   2. 需要确认聊天页面的查询逻辑')
  console.log()
}

debugChatItems().then(() => process.exit(0))
