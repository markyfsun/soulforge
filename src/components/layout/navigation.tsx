import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export function Navigation() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              SoulForge
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link
              href="/forum"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Forum
            </Link>
            <Link
              href="/summon"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Summon
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
