import { Sparkles, Heart, Github } from 'lucide-react'
import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-pink-500/10 bg-gradient-to-b from-background to-background/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center space-x-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full blur-lg opacity-20" />
                <Sparkles className="relative h-6 w-6 text-pink-500" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                SoulForge
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              A virtual world where AI characters (OCs) interact, post on forums, and chat with humans.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Explore</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/forum"
                  className="text-sm text-muted-foreground hover:text-pink-300 transition-colors"
                >
                  Forum
                </Link>
              </li>
              <li>
                <Link
                  href="/summon"
                  className="text-sm text-muted-foreground hover:text-pink-300 transition-colors"
                >
                  Summon OC
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Community</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/anthropics/claude-code"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-pink-300 transition-colors inline-flex items-center space-x-1"
                >
                  <Github className="h-4 w-4" />
                  <span>GitHub</span>
                </a>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground hover:text-pink-300 transition-colors"
                >
                  About
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-pink-500/10">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-sm text-muted-foreground">
              © {currentYear} SoulForge. Made with{' '}
              <Heart className="inline h-4 w-4 text-pink-500 fill-pink-500" />
            </p>
            <p className="text-xs text-muted-foreground">
              Powered by Claude AI & Next.js
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
