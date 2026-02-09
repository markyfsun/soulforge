/**
 * Initialize OC Items and Inventory
 *
 * This script creates sample items and assigns them to OCs for testing
 * the gift-giving functionality.
 *
 * Usage:
 *   npx tsx scripts/init-items.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Sample items to create
 */
const sampleItems = [
  {
    name: '温暖小熊玩偶',
    description: '一个柔软的棕色小熊玩偶，抱起来很舒服。象征着友谊和温暖。',
    personality_effects: '让 OC 更友善、更有同理心',
    rarity: 'common',
    emoji: '🧸'
  },
  {
    name: '幸运四叶草',
    description: '一片罕见的四叶草，据说能带来好运。象征着希望和幸运。',
    personality_effects: '让 OC 更乐观、积极',
    rarity: 'rare',
    emoji: '🍀'
  },
  {
    name: '神秘水晶球',
    description: '一个通透的水晶球，据说能看见未来。象征智慧和洞察力。',
    personality_effects: '让 OC 更有深度、喜欢思考',
    rarity: 'epic',
    emoji: '🔮'
  },
  {
    name: '友谊项链',
    description: '一条精美的项链，象征着珍贵的友谊。每个收到它的人都会倍感珍惜。',
    personality_effects: '让 OC 更重视人际关系、更慷慨',
    rarity: 'rare',
    emoji: '📿'
  },
  {
    name: '勇气勋章',
    description: '一枚闪亮的勋章，表彰勇敢的行为。象征勇气和荣誉。',
    personality_effects: '让 OC 更勇敢、更有冒险精神',
    rarity: 'epic',
    emoji: '🎖️'
  },
  {
    name: '开心糖果',
    description: '色彩斑斓的糖果，吃一颗就会让人心情愉悦。象征快乐和分享。',
    personality_effects: '让 OC 更开朗、幽默',
    rarity: 'common',
    emoji: '🍬'
  },
  {
    name: '治愈药水',
    description: '一瓶散发淡淡荧光的药水，能够治愈心灵的创伤。象征治愈和安慰。',
    personality_effects: '让 OC 更有同情心、乐于助人',
    rarity: 'rare',
    emoji: '🧪'
  },
  {
    name: '智慧之书',
    description: '一本厚重的古书，记录着古老的智慧。象征知识和学问。',
    personality_effects: '让 OC 更理性、喜欢学习',
    rarity: 'epic',
    emoji: '📚'
  },
  {
    name: '音乐盒',
    description: '一个精致的八音盒，播放着动听的旋律。象征艺术和美感。',
    personality_effects: '让 OC 更有艺术气息、优雅',
    rarity: 'rare',
    emoji: '🎵'
  },
  {
    name: '守护符',
    description: '一个神秘的护身符，据说能保护佩戴者。象征保护和责任。',
    personality_effects: '让 OC 更有责任感、可靠',
    rarity: 'legendary',
    emoji: '🛡️'
  }
]

/**
 * Initialize items and distribute to OCs
 */
async function initItems() {
  console.log('\n🎁 初始化物品系统')
  console.log('='.repeat(60))

  try {
    // Check if items already exist
    const { data: existingItems } = await supabase
      .from('oc_items')
      .select('id, name')
      .limit(1)

    if (existingItems && existingItems.length > 0) {
      console.log('⚠️  物品已经存在，跳过初始化')
      console.log('💡 如需重新初始化，请先删除现有物品：')
      console.log('   DELETE FROM oc_inventory;')
      console.log('   DELETE FROM oc_items;')
      return
    }

    // Step 1: Create items
    console.log('\n📦 创建物品...')

    const { data: createdItems, error: createError } = await supabase
      .from('oc_items')
      .insert(sampleItems)
      .select('id, name, emoji, rarity')

    if (createError) {
      throw createError
    }

    console.log(`✅ 创建了 ${createdItems?.length || 0} 个物品:`)
    createdItems?.forEach((item: any) => {
      console.log(`   ${item.emoji} ${item.name} (${item.rarity})`)
    })

    // Step 2: Get all OCs
    console.log('\n👤 获取 OC 列表...')

    const { data: ocs, error: ocsError } = await supabase
      .from('ocs')
      .select('id, name')

    if (ocsError) throw ocsError
    if (!ocs || ocs.length === 0) {
      throw new Error('没有找到任何 OC')
    }

    console.log(`✅ 找到 ${ocs.length} 个 OC`)

    // Step 3: Distribute items to OCs
    console.log('\n🎁 分配物品到 OC...')

    let totalAssigned = 0

    for (const oc of ocs) {
      // Give each OC 2-4 random items
      const numItems = Math.floor(Math.random() * 3) + 2 // 2-4 items
      const shuffledItems = [...createdItems].sort(() => Math.random() - 0.5)
      const ocItems = shuffledItems.slice(0, numItems)

      for (const item of ocItems) {
        const { error: insertError } = await supabase
          .from('oc_inventory')
          .insert({
            oc_id: oc.id,
            item_id: item.id,
            gifted_by: 'system',
          })

        if (!insertError) {
          totalAssigned++
        }
      }

      console.log(`   ✅ ${oc.name}: ${ocItems.length} 个物品`)
    }

    console.log(`\n✅ 总共分配了 ${totalAssigned} 个物品`)

    // Step 4: Summary
    console.log('\n' + '='.repeat(60))
    console.log('✅ 初始化完成')
    console.log('='.repeat(60))
    console.log('\n📊 物品统计:')
    console.log(`   物品种类: ${createdItems?.length || 0}`)
    console.log(`   总分配数: ${totalAssigned}`)
    console.log(`   平均每个OC: ${(totalAssigned / ocs.length).toFixed(1)} 个物品`)

    console.log('\n💡 现在可以测试赠送物品功能了！')
    console.log('   运行: npx tsx scripts/test-gift-item.ts')

  } catch (error) {
    console.error('\n❌ 初始化失败:', error)
    process.exit(1)
  }
}

// Run initialization
initItems()
  .then(() => {
    console.log('\n✨ 完成\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 错误:', error)
    process.exit(1)
  })
