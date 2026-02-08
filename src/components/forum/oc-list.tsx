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
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <Sparkles className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No OCs yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Summon your first character to get started
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
              <div className="group flex items-start gap-3 p-3 rounded-lg hover:bg-card/50 transition-colors cursor-pointer">
                {/* Avatar */}
                <Avatar className="h-10 w-10 border-2 border-primary/20 group-hover:border-primary/40 transition-colors">
                  {oc.avatar_url ? (
                    <AvatarImage src={oc.avatar_url} alt={oc.name} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {initials || <Sparkles className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>

                {/* OC Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                    {oc.name}
                  </h4>
                  {oc.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {oc.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </ScrollArea>
  )
}
