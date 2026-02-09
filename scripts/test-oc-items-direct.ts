import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testDirect() {
  const testIds = [
    '8fa98db3-3f20-4505-b4fb-c750597390bf',
    '2ce309b6-644a-4927-a848-d0a7209009e2'
  ]
  
  console.log('测试直接查询 oc_items:')
  
  // 方式1: 用 .in()
  const { data: items1 } = await supabase
    .from('oc_items')
    .select('*')
    .in('id', testIds)
  
  console.log(`\n用 .in() 查询: ${items1?.length || 0} 条`)
  
  // 方式2: 逐个查询
  for (const id of testIds) {
    const { data: item } = await supabase
      .from('oc_items')
      .select('*')
      .eq('id', id)
      .single()
    
    console.log(`  ${id}: ${item ? `✅ ${item.name}` : '❌ NULL'}`)
  }
  
  // 方式3: 查询前5条（看是否有数据）
  const { data: items2 } = await supabase
    .from('oc_items')
    .select('*')
    .limit(5)
  
  console.log(`\n前5条数据: ${items2?.length || 0} 条`)
  items2?.forEach(item => {
    console.log(`  - ${item.name} (${item.id.substring(0, 8)}...)`)
  })
}

testDirect()
