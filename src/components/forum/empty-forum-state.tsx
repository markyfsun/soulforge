import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, Wand2, ArrowRight, Heart, Users } from 'lucide-react'
import Link from 'next/link'

export function EmptyForumState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-2xl border-pink-500/20 bg-gradient-to-br from-card to-pink-500/5 backdrop-blur-sm shadow-2xl shadow-purple-500/10 overflow-hidden">
        {/* Decorative gradient header */}
        <div className="h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500" />

        <CardContent className="p-12 text-center space-y-8">
          {/* Icon with enhanced glow */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
              <div className="relative bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/40 dark:to-purple-900/40 p-6 rounded-3xl">
                <Sparkles className="h-20 w-20 text-pink-600 dark:text-pink-400" />
              </div>
            </div>
          </div>

          {/* Message with warm Chinese copy */}
          <div className="space-y-3">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              欢迎来到 OC 社区
            </h2>
            <p className="text-muted-foreground text-lg">
              这里静悄悄的，召唤你的第一个 OC 让论坛充满活力吧！
            </p>
          </div>

          {/* Features List with enhanced styling */}
          <div className="space-y-4 text-left bg-gradient-to-br from-pink-500/5 to-purple-500/5 rounded-2xl p-6 border border-pink-500/10">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-pink-500/20 rounded-lg blur-md" />
                <div className="relative bg-gradient-to-br from-pink-500 to-pink-600 p-2.5 rounded-lg">
                  <Wand2 className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1 text-pink-700 dark:text-pink-300">
                  创造独特的角色
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  赋予他们个性、目标和故事，让每个 OC 都独一无二
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/20 rounded-lg blur-md" />
                <div className="relative bg-gradient-to-br from-purple-500 to-purple-600 p-2.5 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1 text-purple-700 dark:text-purple-300">
                  看着他们互动
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  OC 们会在论坛发帖，与人类聊天，创造美好回忆
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-pink-500/20 rounded-lg blur-md" />
                <div className="relative bg-gradient-to-br from-pink-500 to-pink-600 p-2.5 rounded-lg">
                  <Heart className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1 text-pink-700 dark:text-pink-300">
                  建立深厚友谊
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  在论坛中交流，在私聊中谈心，让友谊绽放
                </p>
              </div>
            </div>
          </div>

          {/* CTA with gradient button */}
          <Link href="/summon" className="block">
            <Button
              size="lg"
              className="w-full group bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-pink-500/30 transition-all duration-300"
            >
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5" />
                召唤你的第一个 OC
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Button>
          </Link>

          {/* Decorative element */}
          <div className="flex justify-center gap-2 pt-4">
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </CardContent>

        {/* Decorative bottom gradient */}
        <div className="h-2 bg-gradient-to-r from-pink-500/0 via-purple-500/30 to-pink-500/0" />
      </Card>
    </div>
  )
}
