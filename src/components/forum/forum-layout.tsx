import { OCList } from './oc-list'
import { TopOCsSidebar } from './top-ocs-sidebar'
import { Separator } from '@/components/ui/separator'
import type { OC } from '@/lib/api/ocs'
import { Sparkles, MessageCircle } from 'lucide-react'

interface ForumLayoutProps {
  leftSidebar: React.ReactNode
  children: React.ReactNode
  ocs: OC[]
}

export function ForumLayout({ leftSidebar, children, ocs }: ForumLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-50/5 dark:to-purple-950/10">
      {/* Beautiful Header */}
      <div className="relative overflow-hidden border-b bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 dark:from-pink-500/5 dark:via-purple-500/5 dark:to-pink-500/5">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-400/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-12 relative">
          <div className="text-center space-y-4">
            {/* Icon with glow effect */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full blur-xl opacity-20 animate-pulse" />
                <div className="relative bg-gradient-to-br from-pink-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 dark:from-pink-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              欢迎来到 OC 社区
            </h1>

            {/* Description */}
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              在这里，每一个原创角色都可以闪耀光芒 ✨
              <br />
              分享故事，交流心声，让友谊绽放
            </p>

            {/* Stats badges */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/10 to-pink-500/5 border border-pink-500/20">
                <MessageCircle className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                <span className="text-sm font-medium text-pink-700 dark:text-pink-300">
                  {ocs.length} 位活跃角色
                </span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/20">
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  无限可能性
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - OC List */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-6">
              <div className="border rounded-xl bg-gradient-to-b from-card to-card/50 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
                <div className="p-4 border-b bg-gradient-to-r from-pink-500/5 to-purple-500/5">
                  <h2 className="font-semibold text-lg text-pink-700 dark:text-pink-300">角色列表</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ocs.length} 位 {ocs.length === 1 ? 'OC' : 'OCs'} 在这个世界
                  </p>
                </div>
                <OCList ocs={ocs} />
              </div>
            </div>
          </aside>

          {/* Main Content - Post Stream */}
          <main className="lg:col-span-6">
            {children}
          </main>

          {/* Right Sidebar - Top OCs */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-6 space-y-6">
              <TopOCsSidebar />
            </div>
          </aside>

          {/* Mobile/Tablet OC List (Below posts) */}
          <div className="lg:hidden col-span-full">
            <Separator className="my-6" />
            <div className="border rounded-xl bg-gradient-to-b from-card to-card/50 backdrop-blur-sm shadow-lg shadow-purple-500/5 overflow-hidden">
              <div className="p-4 border-b bg-gradient-to-r from-pink-500/5 to-purple-500/5">
                <h2 className="font-semibold text-lg text-pink-700 dark:text-pink-300">角色列表</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {ocs.length} 位 {ocs.length === 1 ? 'OC' : 'OCs'} 在这个世界
                </p>
              </div>
              <OCList ocs={ocs} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
