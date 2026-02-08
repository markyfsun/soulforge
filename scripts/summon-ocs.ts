/**
 * Batch Summon OCs Script
 *
 * This script summons multiple OCs with different descriptions
 *
 * Usage:
 *   npx tsx scripts/summon-ocs.ts [count]
 *
 * Examples:
 *   # Summon 10 OCs (default)
 *   npx tsx scripts/summon-ocs.ts
 *
 *   # Summon 20 OCs
 *   npx tsx scripts/summon-ocs.ts 20
 */

import * as https from 'https'
import * as http from 'http'

// OC descriptions for diverse characters
const ocDescriptions = [
  '一个热爱烹饪的甜点师，性格温柔开朗，喜欢为别人制作美味的蛋糕和饼干',
  '一个神秘的占卜师，能够通过塔罗牌预测未来，性格冷静深沉',
  '一个充满活力的运动达人，擅长各种体育运动，阳光开朗',
  '一个喜欢读书的学者，知识渊博，戴着一副圆眼镜，文质彬彬',
  '一个热爱音乐的音乐家���会演奏多种乐器，浪漫自由',
  '一个技术精湛的医生，心地善良，总是乐于帮助别人',
  '一个热爱旅行的冒险家，去过很多地方，充满好奇心',
  '一个天真的画家，擅长水彩画，喜欢用画笔记录美好瞬间',
  '一个神秘的魔法师，掌握着古老的魔法知识，优雅神秘',
  '一个热爱机械的工程师，擅长修理各种机械，聪明务实',
  '一个温柔的园丁，擅长照顾花草植物，��自然有着特殊的联系',
  '一个充满想象力的作家，喜欢创作各种精彩的故事',
  '一个热爱时尚的设计师，总是穿着精心设计的服装',
  '一个喜欢星星的天文学家，每晚都会观测星空',
  '一个擅长跳舞的舞者，舞姿优美，充满艺术气质',
  '一个热爱动物的宠物医生，和动物们有着特殊的沟通能力',
  '一个神秘的侦探，善于观察细节，推理能力超强',
  '一个热爱摄影的摄影师，喜欢捕捉生活中的美好瞬间',
  '一个喜欢收集古董的古董商，对历史有着深厚的了解',
  '一个充满童心的玩具设计师，设计出各种有趣的玩具',
]

interface SummonResult {
  success: boolean
  ocId?: string
  name?: string
  error?: string
}

/**
 * Summon a single OC
 */
async function summonOC(description: string, index: number): Promise<SummonResult> {
  return new Promise((resolve) => {
    const data = JSON.stringify({ description })

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/oc/summon',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }

    const req = http.request(options, (res) => {
      let responseData = ''

      res.on('data', (chunk) => {
        responseData += chunk
      })

      res.on('end', () => {
        try {
          const result = JSON.parse(responseData)
          resolve({
            success: result.success,
            ocId: result.data?.id,
            name: result.data?.name,
            error: result.error,
          })
        } catch (error) {
          resolve({
            success: false,
            error: `Failed to parse response: ${error}`,
          })
        }
      })
    })

    req.on('error', (error) => {
      resolve({
        success: false,
        error: `Request failed: ${error.message}`,
      })
    })

    req.write(data)
    req.end()
  })
}

/**
 * Main function to summon OCs
 */
async function summonOCs(count: number): Promise<void> {
  console.log('\n⏰ SoulForge OC Summon Utility\n')
  console.log(`🔍 Summoning ${count} OCs...\n`)

  const results: SummonResult[] = []
  const startTime = performance.now()

  for (let i = 0; i < count; i++) {
    // Use descriptions cyclically
    const description = ocDescriptions[i % ocDescriptions.length]

    console.log(`\n${i + 1}. Summoning OC with description: "${description.substring(0, 30)}..."`)

    const result = await summonOC(description, i)
    results.push(result)

    if (result.success) {
      console.log(`   ✅ Success: ${result.name} (ID: ${result.ocId})`)
    } else {
      console.log(`   ❌ Failed: ${result.error}`)
    }

    // Small delay between summons
    if (i < count - 1) {
      console.log(`   ⏳ Waiting before next summon...`)
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }
  }

  const totalDuration = Math.round(performance.now() - startTime)

  // Summary
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 Summary')
  console.log(`${'='.repeat(60)}\n`)

  const successful = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  console.log(`Total OCs summoned: ${results.length}`)
  console.log(`✅ Successful: ${successful}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⏱️  Total time: ${totalDuration}ms (${Math.round(totalDuration / 1000)}s)\n`)

  if (successful > 0) {
    console.log('✨ Successfully summoned OCs:')
    results
      .filter((r) => r.success)
      .forEach((r, idx) => {
        console.log(`  ${idx + 1}. ${r.name} (${r.ocId})`)
      })
    console.log()
  }

  if (failed > 0) {
    console.log('Failed summons:')
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  ❌ ${r.error}`)
      })
    console.log()
  }
}

// Parse command line arguments
const count = parseInt(process.argv[2]) || 10

// Run the script
summonOCs(count)
  .then(() => {
    console.log('✨ Done!\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  })
