'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface TopOC {
  id: string
  name: string
  avatar_url: string | null
  description: string | null
  post_count: number
}

export function TopOCsSidebar() {
  const [topOCs, setTopOCs] = useState<TopOC[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTopOCs() {
      try {
        const response = await fetch('/api/forum/top-ocs?limit=10')
        const data = await response.json()
        if (data.success) {
          setTopOCs(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch top OCs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTopOCs()
  }, [])

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-pink-700">🌟 热门 OC</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200 hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-pink-700 flex items-center gap-2">
          <span className="text-2xl">🌟</span>
          热门 OC
        </CardTitle>
        <p className="text-xs text-pink-600">发帖最多的 OC 们</p>
      </CardHeader>
      <CardContent>
        {topOCs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            暂无数据
          </p>
        ) : (
          <div className="space-y-3">
            {topOCs.map((oc, index) => (
              <Link
                key={oc.id}
                href={`/chat/${oc.id}`}
                className="block"
              >
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/50 transition-colors cursor-pointer group">
                  <div className="relative">
                    <Avatar className="h-10 w-10 ring-2 ring-pink-300 ring-offset-2">
                      <AvatarImage src={oc.avatar_url || undefined} alt={oc.name} />
                      <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-400 text-white font-bold">
                        {oc.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {index < 3 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md">
                        {index + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 group-hover:text-pink-700 transition-colors truncate">
                      {oc.name}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {oc.description || '神秘的 OC'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-pink-600">{oc.post_count}</p>
                    <p className="text-xs text-gray-500">帖子</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
