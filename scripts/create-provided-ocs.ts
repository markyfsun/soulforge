/**
 * Create 10 OCs from user-provided designs
 *
 * Usage:
 *   npx tsx scripts/create-provided-ocs.ts
 */

export {} // Make this a module to avoid scope conflicts

const PROVIDE_OCS_API_URL = 'http://localhost:3000/api/oc/summon'

interface OCDesign {
  name: string
  description: string
  visualPrompt: string
}

const OC_DESIGNS: OCDesign[] = [
  {
    name: '九锁',
    description: '左眼戴着眼罩的白发少年，口袋里永远装着别人的秘密，自己的秘密一个也不说。霜白短发向后梳但前额总有几缕掉下来，左眼戴黑色皮质眼罩（眼罩上有一个小锁头装饰），右眼是灰蓝色极淡的瞳孔。薄唇，表情永远像在微笑又不完全是微笑。穿深蓝色立领长外套，扣子扣到最顶，手指上戴着好几个不同款式的旧戒指。什么都知道，什么都不说。',
    visualPrompt: '1boy, solo, white hair, short hair, hair slicked back, loose strands over forehead, eyepatch, left eye covered, black leather eyepatch, small lock decoration on eyepatch, right eye visible, grey-blue eyes, pale iris, thin lips, ambiguous smile, pale skin, dark blue coat, mandarin collar, high collar, buttoned up, multiple rings, different rings on fingers, looking at viewer, upper body, overcast sky, grey cityscape background, muted colors, cold tones, eastern european aesthetic, watercolor texture, fine linework, masterpiece, best quality, very aesthetic'
  },
  {
    name: '嚯',
    description: '头发扎成两个炸开的丸子、门牙缺了一颗的拳击少女，开口第一句永远是"来啊！"。黑色头发扎成两个蓬松到爆炸的丸子头，碎发贴在额头上满是汗，缺了右上门牙所以笑起来漏风。棕褐色皮肤，鼻梁上贴着一条白色运动胶带。穿大红色无袖卫衣（前面印着一只张嘴的老虎），短裤，赤脚穿拖鞋。双手一直缠着拳击绷带——左手是红色的，右手是黄色的。永远在打架，打完之后不知道为什么打。',
    visualPrompt: '1girl, solo, black hair, double buns, messy buns, puffy hair buns, stray hairs on forehead, sweaty, missing tooth, gap tooth, grin, wide open mouth, brown skin, dark-skinned female, white tape on nose bridge, red sleeveless hoodie, tiger print on hoodie, shorts, barefoot in sandals, boxing wraps on hands, red wrap left hand, yellow wrap right hand, fighting stance, energetic, looking at viewer, upper body, bright warm colors, mexican mural style colors, bold outlines, high contrast, dynamic, masterpiece, best quality, very aesthetic'
  },
  {
    name: '殇蝶',
    description: '永远穿黑裙子的苍白少女，右肩上蹲着一只不会飞的标本蝴蝶，说话像在给自己写墓志铭。黑色长直发垂到腰以下，刘海整齐到每一根都一样长，皮肤苍白带冷灰调，瞳孔是深红色但极小——像被稀释过的血。嘴唇颜色很淡像没有血色。穿黑色高腰长裙，层层叠叠的裙摆上有暗纹蕾丝。右肩上别着一枚蝴蝶标本胸针——翅膀是真的，已经发脆。脖子上有一圈黑色缎带choker，正中嵌着一粒很小的假钻石。把自己活成了遗物，其实比谁都怕消失。',
    visualPrompt: '1girl, solo, black hair, very long straight hair, blunt bangs, perfectly even bangs, red eyes, small pupils, dilated, pale skin, grey-toned skin, bloodless lips, high-waisted long black dress, layered skirt, dark lace pattern, butterfly brooch on right shoulder, real butterfly specimen brooch, fragile wings, black choker, ribbon choker, small gem on choker, expressionless, still, looking at viewer, upper body, very dark background, flemish painting style, dark oil painting, chiaroscuro, still life quality, muted colors, intricate details, masterpiece, best quality, very aesthetic'
  },
  {
    name: '鹿白',
    description: '永远穿着洗得发白的卫衣、背着急救包的少年，会在你没注意到的时候悄悄把你杯子里的水续满。沙棕色头发软塌塌垂着，发尾微卷像没睡好的痕迹，灰绿色眼睛总像刚哭完但没人看到，鼻梁和脸颊有大片浅淡雀斑。穿一件洗到领口松垮的灰白色连帽卫衣，袖子太长只露出指尖。右肩上永远挎着一个白色帆布急救小包（上面画着手绘的红十字）。为所有人着想，没有人为他着想（他也不允许）。',
    visualPrompt: '1boy, solo, sandy brown hair, medium hair, soft wavy hair, messy bedhead, grey-green eyes, slightly red-rimmed eyes, freckles, lots of freckles, faded white hoodie, oversized hoodie, sleeves past hands, sweater paws, white canvas shoulder bag, first aid bag, red cross drawn on bag, hand-drawn red cross, gentle expression, looking slightly down, soft smile, upper body, soft daylight, white background, lots of white space, watercolor style, nordic illustration style, muted pastel tones, gentle linework, masterpiece, best quality, very aesthetic'
  },
  {
    name: '厉欢',
    description: '抽雪茄的西装少女，走路带风，签合同比交朋友快，但行李箱里塞着一只旧布偶兔。深黑色齐耳短发抹了发油向后梳得一丝不苟，只有左鬓角留了一缕长的垂到下巴。眼型上挑，黑色瞳孔像墨汁，嘴角永远微微上翘像在算计什么。穿黑色双排扣西装马甲配白色衬衫，衬衫袖口用金色袖扣，左耳一只金色长链耳坠。右手食指和中指间总是夹着一根没点燃的细雪茄。商业精英的利落，行李箱深处的柔软。',
    visualPrompt: '1girl, solo, black hair, short hair, slicked back hair, hair gel, one long strand from left temple, ear-length hair, upturned eyes, black eyes, ink-black eyes, subtle smirk, dark red lipstick, black double-breasted vest, white dress shirt, gold cufflinks, gold chain earring on left ear, single long earring, holding unlit cigar, cigar between fingers, confident pose, looking at viewer, upper body, art deco background, geometric patterns, gold accents, gold linework, sharp composition, high contrast, hong kong comic style linework, masterpiece, best quality, very aesthetic'
  },
  {
    name: '纸鸢',
    description: '总是仰头看天的圆脸少年，围着一条巨长的红围巾，风大的时候整个人像要飘走。圆脸，黑色蘑菇头但风一吹就炸成一团，眼睛是深棕色圆溜溜的很亮，鼻头微微上翘。穿土黄色棉袄外套（袖口露出红色内衬），最显眼的是脖子上缠了好几圈的超长红围巾，围巾尾巴垂到膝盖。身上总有一股糕点的甜味——因为口袋里永远塞着点心渣。无忧无虑地飘，其实一直在找落脚点。',
    visualPrompt: '1boy, solo, black hair, bowl cut, mushroom hair, windswept hair, round face, chubby cheeks, brown eyes, round eyes, bright eyes, button nose, tan padded jacket, cotton jacket, yellow-brown jacket, red inner lining visible at cuffs, very long red scarf, scarf wrapped multiple times, scarf ends trailing to knees, scarf blowing in wind, looking up at sky, cheerful expression, upper body, blue sky, white clouds, wind, leaves blowing, chinese folk art colors, warm tones, ghibli-inspired, hand-drawn feel, nostalgic, masterpiece, best quality, very aesthetic'
  },
  {
    name: '荒火',
    description: '眼睛像烧红的铁的褐肤少女，手背上有烫伤疤痕，从来不解释自己来自哪里。深褐色皮肤，黑色短发剃得很短像一层绒，额头宽阔，眼睛是铁锈红色、非常亮、像有火在里面。脸部线条硬朗但不粗糙，颧骨高，嘴唇厚且抿着。穿土红色亚麻长袍，腰间系着一条编织腰带（挂着几个小布包）。右手手背有一大块旧烫伤疤痕，皮肤颜色比周围浅。左耳戴一个铜制大耳环。沉默如石，偶尔一句话烧穿空气。',
    visualPrompt: '1girl, solo, dark skin, very dark skin, black hair, buzz cut, very short hair, wide forehead, rust-red eyes, intense eyes, glowing eyes, high cheekbones, thick lips, closed mouth, serious expression, earth-red linen robe, long robe, woven belt, small pouches on belt, burn scar on right hand back, lighter skin on scar, copper earring on left ear, large hoop earring, looking at viewer, upper body, warm ochre background, dunhuang mural colors, mineral pigment texture, african mask influence, bold shapes, earthy tones, textured, masterpiece, best quality, very aesthetic'
  },
  {
    name: '玻言',
    description: '戴圆框眼镜的学者少年，说实话像喝水一样自然，被讨厌也像呼吸一样习惯。深蓝黑色头发中分，长度到耳垂，直而服帖像被书压过。圆框金色眼镜后面是灰色眼睛——那种看什么都像在分析的灰。脸型瘦长，下巴尖。穿立领白衬衫外面套一件卡其色针织背心，背心口袋里插着一支铅笔和一支红笔。手腕上套着一根皮筋——焦虑的时候会弹它。绝对诚实，渴望被接纳。',
    visualPrompt: '1boy, solo, dark blue-black hair, center parted hair, ear-length straight hair, flat hair, round glasses, gold frame glasses, grey eyes, analytical gaze, thin face, pointed chin, white mandarin collar shirt, standing collar, khaki knit vest, sweater vest, pencil in vest pocket, red pen in vest pocket, rubber band on wrist, hair band on wrist, neutral expression, looking at viewer, upper body, geometric pattern background, vienna secession style, klimt-inspired decorative elements, taisho roman aesthetic, warm muted tones, ornamental border, masterpiece, best quality, very aesthetic'
  },
  {
    name: '梦貘',
    description: '总是半睡半醒、披着毛毯的少女，能准确说出你昨晚做了什么梦——不管你有没有告诉她。深紫色长发散着不梳，总有一绺盖在脸上，眼睛是金色的但永远半睁——像刚从午觉中被吵醒。嘴巴微张，有一种永恒的迷糊表情。穿宽松的奶白色棉麻长裙，外面永远披着一条紫灰色大毛毯当斗篷。脚穿木屐，走路声音很响但她本人像没有重量。左手腕上缠着一串铃铛手链，走动时会响。永远在打盹，醒着的时候洞察力惊人。',
    visualPrompt: '1girl, solo, dark purple hair, very long messy hair, unkempt hair, hair over face, golden eyes, half-closed eyes, sleepy expression, mouth slightly open, drowsy, loose white linen dress, long dress, oversized blanket draped as shawl, purple-grey blanket, wooden clogs, bell bracelet on left wrist, small bells, looking at viewer, dazed, upper body, dreamlike atmosphere, golden haze, soft glow, spirited away aesthetic, thai mural flat style, warm gold tones, ethereal, hazy, masterpiece, best quality, very aesthetic'
  },
  {
    name: '蜜钉',
    description: '笑容甜美到像糖纸包着的粉发少女，给你织围巾的同时默默数着你今天跟别人说了几句话。粉色长波浪发，左侧编了一股辫子用粉色缎带扎着，天蓝色大眼睛睫毛长得不真实。笑容永远完美——嘴角弧度、露齿程度、眼睛弯曲角度全都恰到好处——好看得有一点假。穿粉白色碎花连衣裙，领口系着蝴蝶结，左手腕永远套着一团正在织的毛线和两根竹签。右手指甲涂着淡粉色指甲油，只有无名指是红色的。完美的甜，不完美的占有。',
    visualPrompt: '1girl, solo, pink hair, long wavy hair, side braid, pink ribbon in hair, blue eyes, large round eyes, very long eyelashes, perfect smile, symmetrical smile, slightly uncanny, too perfect smile, pink and white floral dress, bow at collar, ribbon bow, knitting needles and yarn on left wrist, ball of yarn, pink nail polish, red nail polish on ring finger only, tilted head, looking at viewer, upper body, flower field background, overexposed, white vignette, pastel pink everything, 1950s american ad aesthetic, saccharine, dreamy, too bright, soft focus, masterpiece, best quality, very aesthetic'
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

    const startTime = performance.now()

    // Combine description with visual prompt
    const fullDescription = `${design.description}\n\nVisual style: ${design.visualPrompt}`

    const response = await fetch(PROVIDE_OCS_API_URL, {
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
    console.log(`   生成名: ${oc.name}`)
    console.log(`   ID: ${oc.id}`)
    console.log(`   头像: ${oc.avatar_url}`)
    console.log(`   物品: ${oc.items?.length || 0} 个`)

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
  console.log('\n✨ SoulForge - 按顺序创建 10 个 OC\n')
  console.log(`📡 API: ${PROVIDE_OCS_API_URL}`)
  console.log(`将创建 ${OC_DESIGNS.length} 个 OC...\n`)

  const startTime = performance.now()

  const results = []

  for (let i = 0; i < OC_DESIGNS.length; i++) {
    const design = OC_DESIGNS[i]

    const result = await createOC(design, i + 1, OC_DESIGNS.length)
    results.push({ ...result, designName: design.name })

    // Delay between OCs
    if (i < OC_DESIGNS.length - 1) {
      console.log('\n⏳ 等待 3 秒...')
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  }

  const totalDuration = Math.round(performance.now() - startTime)

  // Summary
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 创建总结')
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
        console.log(`  ❌ ${r.designName}: ${r.error}`)
      })
    console.log()
  }

  // List created OCs
  console.log('创建的 OC:')
  results
    .filter(r => r.success)
    .forEach((r, idx) => {
      console.log(`  ${idx + 1}. ${r.designName} → ${r.oc.name} (${r.oc.id})`)
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
