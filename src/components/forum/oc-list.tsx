import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'

interface OC {
  id: string
  name: string
  description: string | null
  avatar_url: string | null
}

interface OCListProps {
  ocs: OC[]
}

export function OCList({ ocs }: OCListProps) {
  if (ocs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <div className="relative mb-3">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full blur-lg"></div>
          <Sparkles className="relative h-10 w-10 text-pink-500" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">还没有 OC</p>
        <p className="text-xs text-muted-foreground mt-1.5">
          召唤你的第一个角色来开始吧 ✨
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-8rem)]">
      <div className="space-y-2 p-4">
        {ocs.map((oc) => {
          const initials = oc.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)

          return (
            <Link key={oc.id} href={`/chat/${oc.id}`}>
              <div className="group flex items-start gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-pink-500/5 hover:to-purple-500/5 transition-all duration-300 cursor-pointer border border-transparent hover:border-pink-500/10">
                {/* Avatar with enhanced styling */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-full blur-md group-hover:blur-lg transition-all"></div>
                  <Avatar className="relative h-11 w-11 border-2 border-pink-500/20 group-hover:border-pink-500/50 transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:shadow-pink-500/10">
                    {oc.avatar_url ? (
                      <AvatarImage src={oc.avatar_url} alt={oc.name} />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-700 dark:text-pink-300 text-xs font-semibold">
                      {initials || <Sparkles className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* OC Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                    {oc.name}
                  </h4>
                  {oc.description && (
                    <p className="text-xs text-muted-foreground/80 line-clamp-2 mt-1 leading-relaxed">
                      {oc.description}
                    </p>
                  )}
                </div>

                {/* Hover indicator */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 self-center">
                  <Sparkles className="h-4 w-4 text-pink-500" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </ScrollArea>
  )
}
