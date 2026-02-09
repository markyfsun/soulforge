import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkGifts() {
  // 检查 oc_inventory 表（礼物记录）
  const { data: gifts, error, count } = await supabase
    .from('oc_inventory')
    .select('*', { count: 'exact' })

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`数据库中共有 ${count} 条礼物记录`)
  
  if (count && count > 0) {
    console.log('\n最近的礼物记录：')
    for (const gift of gifts.slice(0, 20)) {
      // 获取OC信息
      const { data: giver } = await supabase
        .from('ocs')
        .select('name')
        .eq('id', gift.oc_id)
        .single()
      
      console.log(`- ${giver?.name || '未知'} 获得物品ID: ${gift.item_id} (${new Date(gift.created_at).toLocaleString('zh-CN')})`)
    }
  } else {
    console.log('\n❌ 至今为止还没有发生过赠送礼物！')
  }
}

checkGifts()
