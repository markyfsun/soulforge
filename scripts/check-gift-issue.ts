import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkGiftIssue() {
  // 检查是否有物品的 oc_id 指向不存在或错误的 OC
  const { data: inventory, error } = await supabase
    .from('oc_inventory')
    .select('id, oc_id, item_id, gifted_by, received_at, oc_items(name), ocs(name)')

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`总共有 ${inventory.length} 条物品记录`)

  // 检查有 gifted_by 的记录
  const giftedItems = inventory.filter(item => item.gifted_by)
  console.log(`\n被赠送过的物品: ${giftedItems.length} 条`)

  // 检查是否有异常：gifted_by 和 oc_id 相同（自己给自己送？）
  const weird = giftedItems.filter(item => item.gifted_by === item.oc_id)
  if (weird.length > 0) {
    console.log(`\n⚠️  异常：自己给自己的物品 ${weird.length} 条`)
  }

  // 显示最近的赠送
  console.log('\n最近10个赠送记录：')
  const recentGifts = giftedItems
    .sort((a, b) => new Date(b.received_at || 0).getTime() - new Date(a.received_at || 0).getTime())
    .slice(0, 10)

  for (const item of recentGifts) {
    const ownerName = (item as any).ocs?.name || '未知'
    const itemName = (item as any).oc_items?.name || '未知'
    const receivedTime = item.received_at ? new Date(item.received_at).toLocaleString('zh-CN') : '未知'
    console.log(`- ${ownerName} 拥有 ${itemName} (收到于 ${receivedTime})`)
  }
}

checkGiftIssue()
