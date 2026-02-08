'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLogger } from '@/lib/logger'

export default function SummonPage() {
  const logger = useLogger('SummonPage')
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [isSummoning, setIsSummoning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summonedOC, setSummonedOC] = useState<any>(null)

  logger.info('SummonPage initialized', {
    hasSummonedOC: !!summonedOC,
    isClient: true,
  })

  const handleSummon = async () => {
    if (!description.trim()) {
      logger.warn('Empty description submitted')
      setError('请输入角色描述')
      return
    }

    logger.info('Summon button clicked', {
      descriptionLength: description.length,
      descriptionPreview: description.substring(0, 50) + '...'
    })

    setIsSummoning(true)
    setError(null)

    const startTime = performance.now()

    try {
      logger.trackUserAction('summon_oc_started', {
        descriptionLength: description.length,
      })

      const response = await fetch('/api/oc/summon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      })

      const duration = performance.now() - startTime
      logger.trackApiCall('POST', '/api/oc/summon', response.status, duration)

      const data = await response.json()

      if (data.success) {
        logger.info('OC summon successful', {
          ocId: data.oc.id,
          ocName: data.oc.name,
          itemsCount: data.oc.items?.length || 0,
          duration: Math.round(duration)
        })

        setSummonedOC(data.oc)
        logger.trackUserAction('summon_oc_completed', {
          ocId: data.oc.id,
          ocName: data.oc.name,
        })

        // Redirect to forum after 2 seconds
        setTimeout(() => {
          router.push('/forum')
        }, 2000)
      } else {
        logger.warn('OC summon failed', {
          error: data.error,
          duration: Math.round(duration)
        })
        setError(data.error || '召唤 OC 失败')
      }
    } catch (err) {
      const duration = performance.now() - startTime
      logger.error('Summoning error', err as Error, {
        descriptionLength: description.length,
        duration: Math.round(duration)
      })
      setError('发生了意外错误')
    } finally {
      setIsSummoning(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            召唤原创角色
          </h1>
          <p className="text-xl text-purple-200">
            描述你想要的角色，看着他们诞生
          </p>
        </div>

        {/* Summon Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <label className="block text-white text-lg font-semibold mb-3">
            角色描述
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="描述你的角色...（例如：'一个害羞的学者，热爱古书但害怕黑暗'）"
            className="w-full h-48 p-4 rounded-lg bg-white/20 text-white placeholder-purple-300 backdrop-blur border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
            disabled={isSummoning}
          />

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
              {error}
            </div>
          )}

          <button
            onClick={handleSummon}
            disabled={isSummoning || !description.trim()}
            className="mt-6 w-full py-4 px-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold text-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
          >
            {isSummoning ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                召唤中...
              </span>
            ) : (
              '召唤 OC'
            )}
          </button>

          {/* Examples */}
          <div className="mt-8">
            <p className="text-purple-200 text-sm mb-3">试试这些例子：</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                '一个勇敢但害怕蜘蛛的骑士',
                '一个喜欢恶作剧的顽皮小精灵',
                '一个记性不好的智慧老巫师',
                '一个五音不全的开心吟游诗人',
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setDescription(example)}
                  className="text-left p-3 bg-white/10 hover:bg-white/20 rounded-lg text-purple-200 text-sm transition-colors border border-white/10"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Success State */}
        {summonedOC && (
          <div className="mt-8 bg-green-500/20 backdrop-blur-lg rounded-2xl p-8 border border-green-500/50">
            <div className="text-center">
              <div className="text-6xl mb-4">✨</div>
              <h2 className="text-3xl font-bold text-white mb-2">
                召唤成功！
              </h2>
              <p className="text-green-200 text-lg mb-4">
                见见 <span className="font-bold">{summonedOC.name}</span>！
              </p>
              <p className="text-white/80 mb-6">{summonedOC.description}</p>
              <div className="text-sm text-green-200">
                即将跳转到论坛...
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
