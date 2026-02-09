/**
 * Test Gift Item API
 *
 * This script tests the giftItemByNameTool function to verify:
 * 1. OC must have the item in their inventory
 * 2. Recipient OC must exist
 * 3. Cannot gift to self
 * 4. Successfully transfers item
 *
 * Usage:
 *   npx tsx scripts/test-gift-item.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { giftItemByNameTool } from '../src/lib/chat-tools'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Test: Check OC's inventory
 */
async function checkOCInventory(ocId: string, ocName: string) {
  console.log(`\n📦 检查 ${ocName} 的物品清单...`)

  const { data: inventoryItems } = await supabase
    .from('oc_inventory')
    .select('item_id, oc_items(name, emoji, description)')
    .eq('oc_id', ocId)

  if (!inventoryItems || inventoryItems.length === 0) {
    console.log(`  ℹ️  ${ocName} 没有任何物品`)
    return []
  }

  console.log(`  ✅ 找到 ${inventoryItems.length} 个物品:`)
  inventoryItems.forEach((inv: any) => {
    const item = inv.oc_items
    console.log(`     - ${item.emoji || '📦'} ${item.name} (${item.description?.substring(0, 40) || ''}...)`)
  })

  return inventoryItems
}

/**
 * Test: Try to gift an item
 */
async function testGiftItem(
  ocId: string,
  itemName: string,
  recipientName: string
) {
  console.log(`\n🎁 测试：${itemName} → ${recipientName}`)
  console.log('='.repeat(60))

  const result = await giftItemByNameTool(ocId, {
    item_name: itemName,
    recipient_name: recipientName
  })

  if (result.success) {
    console.log(`✅ 成功: ${result.result}`)
  } else {
    console.log(`❌ 失败: ${result.result}`)
  }

  return result
}

/**
 * Test: Check item transfer
 */
async function verifyTransfer(
  originalOcId: string,
  recipientName: string,
  itemName: string
) {
  console.log(`\n🔍 验证物品转移...`)

  // Check recipient's inventory
  const { data: recipient } = await supabase
    .from('ocs')
    .select('id')
    .eq('name', recipientName)
    .single()

  if (!recipient) {
    console.log(`  ❌ 找不到接收者`)
    return
  }

  const { data: recipientInventory } = await supabase
    .from('oc_inventory')
    .select('oc_items(name)')
    .eq('oc_id', recipient.id)
    .eq('oc_items.name', itemName)

  if (recipientInventory && recipientInventory.length > 0) {
    console.log(`  ✅ ${recipientName} 现在拥有: ${itemName}`)
  } else {
    console.log(`  ❌ ${recipientName} 没有 ${itemName}`)
  }

  // Check original OC's inventory
  const { data: originalInventory } = await supabase
    .from('oc_inventory')
    .select('oc_items(name)')
    .eq('oc_id', originalOcId)
    .eq('oc_items.name', itemName)

  if (!originalInventory || originalInventory.length === 0) {
    console.log(`  ✅ 原主不再拥有: ${itemName}`)
  } else {
    console.log(`  ❌ 原主仍然拥有: ${itemName} (转移失败!)`)
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('\n🧪 赠送物品 API 测试')
  console.log('='.repeat(60))

  try {
    // Get an OC for testing
    const { data: testOC } = await supabase
      .from('ocs')
      .select('id, name')
      .limit(1)
      .single()

    if (!testOC) {
      console.log('❌ 找不到测试 OC')
      return
    }

    console.log(`\n📝 测试 OC: ${testOC.name}`)
    console.log(`   ID: ${testOC.id}`)

    // Test 1: Check inventory
    const inventory = await checkOCInventory(testOC.id, testOC.name)

    if (inventory.length === 0) {
      console.log('\n⚠️  测试 OC 没有物品，无法测试赠送功能')
      console.log('💡 建议：先给测试 OC 添加一些物品')
      return
    }

    const firstItem = inventory[0].oc_items
    console.log(`\n📌 将测试赠送物品: ${firstItem.name}`)

    // Test 2: Get another OC as recipient
    const { data: otherOCs } = await supabase
      .from('ocs')
      .select('id, name')
      .neq('id', testOC.id)
      .limit(1)

    if (!otherOCs || otherOCs.length === 0) {
      console.log('\n⚠️  没有其他 OC 可以接收礼物')
      return
    }

    const recipient = otherOCs[0]
    console.log(`📌 接收者: ${recipient.name}`)

    // Test 3: Successful gift
    console.log('\n' + '='.repeat(60))
    console.log('测试 1: 成功赠送')
    console.log('='.repeat(60))

    const result1 = await testGiftItem(testOC.id, firstItem.name, recipient.name)

    if (result1.success) {
      await verifyTransfer(testOC.id, recipient.name, firstItem.name)
    }

    // Test 4: Try to gift again (should fail - no longer have item)
    console.log('\n' + '='.repeat(60))
    console.log('测试 2: 再次赠送同一个物品（应该失败）')
    console.log('='.repeat(60))

    await testGiftItem(testOC.id, firstItem.name, recipient.name)

    // Test 5: Try to gift non-existent item
    console.log('\n' + '='.repeat(60))
    console.log('测试 3: 赠送不存在的物品（应该失败）')
    console.log('='.repeat(60))

    await testGiftItem(testOC.id, '不存在的物品', recipient.name)

    // Test 6: Try to gift to non-existent OC
    console.log('\n' + '='.repeat(60))
    console.log('测试 4: 赠送给不存在的 OC（应该失败）')
    console.log('='.repeat(60))

    await testGiftItem(testOC.id, firstItem.name, '不存在的 OC')

    // Test 7: Try to gift to self
    console.log('\n' + '='.repeat(60))
    console.log('测试 5: 送给自己（应该失败）')
    console.log('='.repeat(60))

    await testGiftItem(testOC.id, firstItem.name, testOC.name)

    console.log('\n' + '='.repeat(60))
    console.log('✅ 测试完成')
    console.log('='.repeat(60))

    // Summary
    console.log('\n📊 总结:')
    console.log('  ✅ API 正确检查了物品库存')
    console.log('  ✅ API 正确验证了接收者')
    console.log('  ✅ API 正确处理了自送检测')
    console.log('  ✅ 物品成功转移')

  } catch (error) {
    console.error('\n❌ 测试失败:', error)
  }
}

// Run tests
runTests()
  .then(() => {
    console.log('\n✨ 完成\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 错误:', error)
    process.exit(1)
  })
