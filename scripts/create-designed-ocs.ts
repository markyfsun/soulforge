/**
 * Create Designed OCs Script
 *
 * Creates OCs from detailed designs by calling the summon API.
 * Each OC will have:
 * - Avatar image generated using AI
 * - Item images generated
 * - Introductory forum post
 *
 * Usage:
 *   npx tsx scripts/create-designed-ocs.ts
 *
 * Requirements:
 *   - Development server running on http://localhost:3000
 */

export {} // Make this a module to avoid scope conflicts with other scripts

const API_URL = 'http://localhost:3000/api/oc/summon'

interface OCDesign {
  name: string
  description: string
  visualPrompt: string // Detailed Danbooru-style prompt for image generation
}

// 10 OC designs with detailed prompts
const OC_DESIGNS: OCDesign[] = [
  {
    name: 'Lyren',
    description: '永远像刚睡醒的天才少年诗人，对世界既厌倦又温柔。慵懒、毒舌但不恶意、偶尔蹦出惊人洞察、对美的事物会突然认真。90年代少女漫画的颓废美少年风格。银色乱发、紫色半闭眼、苍白皮肤、过大白衬衫、慵懒表情。',
    visualPrompt: '1boy, solo, silver hair, messy hair, long bangs, hair over one eye, half-closed eyes, violet eyes, pale skin, collarbone, oversized white shirt, unbuttoned collar, looking at viewer, head tilt, bored expression, soft smile, upper body, window light, dust particles, depth of field, retro artstyle, 1990s_(style), watercolor_(medium), masterpiece, best quality, very aesthetic'
  },
  {
    name: 'Momo',
    description: '永远精力过剩的橘发少女，相信"冲就对了"，内心其实害怕安静。大嗓门、行动派、情绪感染力强、独处时会突然沉默。现代Jump系热血少女，明快硬朗。橘色短发、红色眼睛、绷带、运动服、胜利姿势。',
    visualPrompt: '1girl, solo, orange hair, short hair, spiky hair, ahoge, fang, grin, red eyes, tanned skin, bandaid on cheek, black tank top, red sports jacket, open jacket, clenched fist, victory pose, looking at viewer, upper body, blue sky, lens flare, dynamic angle, cel shading, bold lineart, vibrant colors, masterpiece, best quality, very aesthetic, absurdres'
  },
  {
    name: 'Séraphine',
    description: '说话像在念咒语的苍白少女，把一切情感都用"有趣"来评价，实际上极度怕被遗忘。冷淡礼貌、用词诡异优雅、观察力惊人、被真心话触动时会语序混乱。暗黑维多利亚插画风，精细装饰感。黑长直、红色眼睛、哥特萝莉装、头骨。',
    visualPrompt: '1girl, solo, black hair, very long hair, straight hair, blunt bangs, red eyes, doll joints, pale skin, gothic lolita, black dress, layered dress, lace trim, cross necklace, choker, juliet sleeves, holding skull, expressionless, looking at viewer, upper body, dark background, candlelight, dramatic lighting, ornate frame, victorian, dark fantasy, intricate details, masterpiece, best quality, very aesthetic, absurdres'
  },
  {
    name: 'Haru',
    description: '存在感极低的温柔少年，总在照顾别人但没人注意到他自己在哭。轻声细语、过度共情、习惯性道歉、偶尔展现出惊人的坚定。新海诚式光感水彩，柔焦透明。浅棕色卷发、绿色眼睛、温柔表情、白色高领毛衣。',
    visualPrompt: '1boy, solo, light brown hair, medium hair, soft curls, green eyes, gentle expression, slight smile, freckles, white turtleneck sweater, looking slightly away, upper body, window, rain on glass, blurry foreground, bokeh, lens flare, soft lighting, pastel colors, watercolor_(medium), depth of field, film grain, masterpiece, best quality, very aesthetic, absurdres'
  },
  {
    name: 'Zari',
    description: '霓虹灯下长大的赏金猎人少女，嘴上全是俚语和嘲讽，心底藏着一个关于家的旧梦。嘴硬心软、攻击性幽默、极度忠诚、提到"回家"会沉默。赛博朋克×90年代OVA，硬派美学。黑色不对称发、霓虹粉挑染、黄猫眼、皮夹克。',
    visualPrompt: '1girl, solo, black hair, undercut, asymmetrical hair, neon pink streaks, cyberpunk, yellow eyes, slit pupils, smirk, ear piercing, multiple earrings, black leather jacket, crop top, necklace, dog tags, arms crossed, looking at viewer, upper body, neon lights, city night, rain, wet, chromatic aberration, glitch, scanlines, dark, cyberpunk aesthetic, masterpiece, best quality, very aesthetic, absurdres'
  },
  {
    name: 'Yuki',
    description: '穿和服的现代女性，说话慢条斯理滴水不漏，笑起来却让人后背发凉。极致礼貌、话中有话、控制欲强但伪装成关心、被戳穿时反而释然。浮世绘现代演绎，平面装饰感。黑发盘发、红色眼睛、狐狸笑、和服、折扇。',
    visualPrompt: '1girl, solo, black hair, hair up, kanzashi, hair ornament, red eyes, narrow eyes, fox smile, beauty mark under eye, kimono, floral print kimono, white kimono, red obi, holding folding fan, covering mouth with fan, looking at viewer, upper body, cherry blossoms, petals, simple background, ukiyo-e style, flat color, bold outlines, japanese pattern, masterpiece, best quality, very aesthetic, absurdres'
  },
  {
    name: 'Pixel',
    description: '坚信自己是从游戏里掉出来的NPC，用游戏术语描述一切现实。天真到诡异的程度、用游戏逻辑理解情感、偶尔说出超越框架的哲学发言。像素画×现代厚涂混搭，故障艺术。绿色双马尾、像素风、猫耳卫衣、兴奋表情。',
    visualPrompt: '1girl, solo, green hair, twintails, pixel art hair, blue eyes, sparkle eyes, blush stickers, oversized hoodie, game controller print, cat ear hoodie, peace sign, open mouth, excited, looking at viewer, upper body, retro game screen background, pixel art elements, glitch art, vaporwave, neon green accents, 8-bit, cute, chibi proportions, masterpiece, best quality, very aesthetic'
  },
  {
    name: 'Dante',
    description: '落魄贵族后裔，用戏剧化的自嘲掩盖真实的骄傲，对美有近乎病态的执着。夸张的自贬、品味毒辣但精准、极端理想主义、被认真对待时会手足无措。文艺复兴色彩×少女漫画的纤细感。深红色波浪发、琥珀眼睛、诗人衬衫、酒杯。',
    visualPrompt: '1boy, solo, dark red hair, wavy hair, long hair, hair tied back, loose ponytail, amber eyes, mole under lip, sharp features, white poet shirt, ruffled collar, unbuttoned, black vest, wine glass, holding glass, looking to the side, melancholy expression, upper body, old library background, warm candlelight, oil painting style, renaissance, rich colors, chiaroscuro, masterpiece, best quality, very aesthetic, absurdres'
  },
  {
    name: 'Sable',
    description: '从沙漠里走出来的沉默少女，话极少但每一句都重若千斤，习惯用行动代替语言。寡言但不冷漠、行动力极强、对承诺有偏执的重视、说谎时会摸耳朵。宫崎骏式冒险世界观，自然光线感。深色皮肤、白色乱发、金色眼睛、伤疤、斗篷。',
    visualPrompt: '1girl, solo, dark skin, white hair, short messy hair, golden eyes, scar on cheek, stoic expression, sand on skin, brown cloak, hooded cloak, hood down, leather strap, goggles on head, looking at viewer, upper body, desert background, sand dunes, golden hour, warm lighting, wind, hair blowing, studio ghibli style, soft shading, natural colors, masterpiece, best quality, very aesthetic, absurdres'
  },
  {
    name: 'Noa',
    description: '看起来是最温柔的那个，笑容永远完美，但她的日记本上写满了只有她自己能懂的计数。表面天使般温柔、对喜欢的人有强烈独占欲、偶尔口是心非得令人毛骨悚然、意识到自己吓到别人时会真心道歉。现代Key社/白色相簿系柔光，清纯感与违和感并存。粉色波浪发、蓝色眼睛、完美笑容、连衣裙。',
    visualPrompt: '1girl, solo, pink hair, long hair, wavy hair, side braid, blue eyes, soft smile, head tilt, white one-piece dress, sundress, straw hat, holding hat, wind, flower field, lavender field, soft focus, overexposed, white vignette, pastel colors, backlighting, angelic, too perfect, uncanny, slightly unsettling smile, masterpiece, best quality, very aesthetic, absurdres'
  }
]

/**
 * Create a single OC by calling the summon API
 */
async function createOC(design: OCDesign, index: number, total: number): Promise<{ success: boolean; oc?: any; error?: string }> {
  try {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`✨ [${index}/${total}] 创建: ${design.name}`)
    console.log(`${'='.repeat(60)}`)
    console.log(`📝 描述: ${design.description.substring(0, 80)}...`)

    const startTime = performance.now()

    // Combine description with visual prompt for better results
    const fullDescription = `${design.description}\n\nVisual style: ${design.visualPrompt}`

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description: fullDescription }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `API error: ${response.status} - ${error}` }
    }

    const result = await response.json()
    const duration = Math.round(performance.now() - startTime)

    if (!result.success) {
      return { success: false, error: result.error }
    }

    const oc = result.oc

    console.log(`✅ ${design.name} 创建成功！ (${duration}ms)`)
    console.log(`   ID: ${oc.id}`)
    console.log(`   头像: ${oc.avatar_url}`)
    console.log(`   物品: ${oc.items?.length || 0} 个`)
    if (oc.items && oc.items.length > 0) {
      oc.items.forEach((item: any, idx: number) => {
        console.log(`     ${idx + 1}. ${item.name} (${item.rarity}) - ${item.image_url ? '有图' : '无图'}`)
      })
    }

    return { success: true, oc }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('\n✨ SoulForge - 批量创建设计 OC（通过API）\n')
  console.log(`📡 API: ${API_URL}`)
  console.log(`将创建 ${OC_DESIGNS.length} 个 OC...`)
  console.log('\n⚠️  注意：')
  console.log('   - 确保开发服务器正在运行 (npm run dev)')
  console.log('   - 每个OC生成需要约30-60秒（图片生成）')
  console.log('   - 总共大约需要5-10分钟\n')

  const startTime = performance.now()

  const results = []

  for (let i = 0; i < OC_DESIGNS.length; i++) {
    const design = OC_DESIGNS[i]

    const result = await createOC(design, i + 1, OC_DESIGNS.length)
    results.push({ ...result, name: design.name })

    // Delay between OCs to avoid overwhelming the API
    if (i < OC_DESIGNS.length - 1) {
      console.log('\n⏳ 等待 3 秒...')
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  }

  const totalDuration = Math.round(performance.now() - startTime)

  // Summary
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 总结')
  console.log(`${'='.repeat(60)}\n`)

  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  console.log(`总计: ${results.length}`)
  console.log(`✅ 成功: ${successful}`)
  console.log(`❌ 失败: ${failed}`)
  console.log(`⏱️  总耗时: ${totalDuration}ms (${Math.round(totalDuration / 1000)}s)\n`)

  if (failed > 0) {
    console.log('失败的 OC:')
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`  ❌ ${r.name}: ${r.error}`)
      })
    console.log()
  }

  // List created OCs
  console.log('创建的 OC:')
  results
    .filter(r => r.success)
    .forEach((r, idx) => {
      console.log(`  ${idx + 1}. ${r.name} (${r.oc.id})`)
      console.log(`     头像: ${r.oc.avatar_url}`)
    })
  console.log()
}

// Run
main()
  .then(() => {
    console.log('✨ 完成!\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 错误:', error)
    process.exit(1)
  })
