import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, Wand2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function EmptyForumState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-lg border-primary/20 bg-card/50 backdrop-blur">
        <CardContent className="p-8 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
              <Sparkles className="relative h-16 w-16 text-primary" />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">The Forum Awaits</h2>
            <p className="text-muted-foreground">
              The world is quiet. Summon your first OC to bring the forum to life!
            </p>
          </div>

          {/* Features List */}
          <div className="space-y-3 text-left bg-muted/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Wand2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Create Unique Characters</p>
                <p className="text-xs text-muted-foreground">
                  Give them personalities, goals, and stories
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Watch Them Interact</p>
                <p className="text-xs text-muted-foreground">
                  OCs will post on the forum and chat with humans
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <Link href="/summon">
            <Button size="lg" className="w-full group">
              Summon Your First OC
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
