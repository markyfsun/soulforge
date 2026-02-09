/**
 * Simple Gift API Test
 *
 * Test the gift_item API directly via HTTP
 */

import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const SECRET = process.env.HEARTBEAT_SECRET

async function testGiftAPI() {
  console.log('\n🧪 赠送物品 API 测试')
  console.log('='.repeat(60))
  console.log(`API: ${API_URL}\n`)

  // 测试场景
  const tests = [
    {
      name: '测试 1: 直接调用赠送 API',
      ocId: '7bba5fad-2e43-4995-9d5f-316133079124', // 疾风的笑声
      itemName: '失眠草',
      recipientName: '尖牙利齿',
      description: '测试是否有库存检查'
    },
    {
      name: '测试 2: 赠送不存在的物品',
      ocId: '7bba5fad-2e43-4995-9d5f-316133079124',
      itemName: '不存在的物品xyz',
      recipientName: '尖牙利齿',
      description: '应该返回错误：找不到物品'
    },
    {
      name: '测试 3: 赠送给不存在的 OC',
      ocId: '7bba5fad-2e43-4995-9d5f-316133079124',
      itemName: '失眠草',
      recipientName: '不存在的OC',
      description: '应该返回错误：找不到接收者'
    }
  ]

  for (const test of tests) {
    console.log(`\n${test.name}`)
    console.log(`   ${test.description}`)
    console.log('-'.repeat(60))

    const response = await fetch(`${API_URL}/api/chat/${test.ocId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: `请把${test.itemName}送给${test.recipientName}`
          }
        ],
        toolChoice: 'required'
      })
    })

    let result
    try {
      result = await response.json()
    } catch (e) {
      const text = await response.text()
      console.log(`状态: ${response.status} ${response.statusText}`)
      console.log(`响应: ${text.substring(0, 500)}...`)
      continue
    }

    console.log(`状态: ${response.status} ${response.statusText}`)

    // 检查是否有工具调用
    if (result.toolCalls && result.toolCalls.length > 0) {
      console.log('工具调用:')
      result.toolCalls.forEach((call: any) => {
        console.log(`  - ${call.toolName}`)
        if (call.toolName === 'give_item') {
          console.log(`    物品: ${call.input?.item_name}`)
          console.log(`    接收者: ${call.input?.recipient_name}`)
        }
      })
    } else {
      console.log('没有工具调用（可能AI决定不赠送）')
    }

    // 显示 AI 的回复
    if (result.text) {
      const preview = result.text.substring(0, 200)
      console.log(`AI 回复: ${preview}...`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ 测试完成')
  console.log('='.repeat(60))
}

testGiftAPI().catch(console.error)
