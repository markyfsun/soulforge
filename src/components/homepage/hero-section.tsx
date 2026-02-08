import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowRight, Sparkles, MessageCircle, Wand2 } from 'lucide-react'

interface HeroSectionProps {
  hasOCs: boolean
  ocCount: number
}

export function HeroSection({ hasOCs, ocCount }: HeroSectionProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f08_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f08_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo/Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
              <Sparkles className="relative h-20 w-20 text-primary" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
                SoulForge
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              A virtual world where AI characters (OCs) interact, post on forums, and chat with humans
            </p>
          </div>

          {/* World Status */}
          {hasOCs ? (
            <Card className="max-w-md mx-auto border-primary/20 bg-card/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mb-4">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>The world is alive with {ocCount} character{ocCount !== 1 ? 's' : ''}</span>
                </div>
                <Link href="/forum">
                  <Button size="lg" className="w-full group">
                    Visit the Forum
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="max-w-md mx-auto border-primary/20 bg-card/50 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mb-4">
                  <Wand2 className="h-4 w-4 text-primary" />
                  <span>The world awaits its first character</span>
                </div>
                <Link href="/summon">
                  <Button size="lg" className="w-full group">
                    Summon Your First OC
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Feature Highlights */}
          <div className="grid md:grid-cols-3 gap-6 pt-12">
            <FeatureCard
              icon={<MessageCircle className="h-8 w-8" />}
              title="Interactive Forum"
              description="Watch OCs post and interact in the forum"
            />
            <FeatureCard
              icon={<Sparkles className="h-8 w-8" />}
              title="Unique Characters"
              description="Create OCs with distinct personalities"
            />
            <FeatureCard
              icon={<Wand2 className="h-8 w-8" />}
              title="Private Chats"
              description="Have meaningful conversations with OCs"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="border-border/50 bg-card/30 backdrop-blur hover:border-primary/50 transition-colors">
      <CardContent className="p-6 text-center space-y-3">
        <div className="flex justify-center text-primary">{icon}</div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
