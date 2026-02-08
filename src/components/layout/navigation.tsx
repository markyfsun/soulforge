'use client'

import Link from 'next/link'
import { Sparkles, MessageCircle, Wand2, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { href: '/forum', label: 'Forum', icon: MessageCircle },
    { href: '/summon', label: 'Summon', icon: Wand2 },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/80 backdrop-blur-lg border-b border-pink-500/10 shadow-lg shadow-pink-500/5'
          : 'bg-background/60 backdrop-blur-md border-b border-pink-500/5'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo with animated gradient */}
          <Link
            href="/"
            className="flex items-center space-x-2 group"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
              <Sparkles className="relative h-7 w-7 text-pink-500 group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient bg-gradient-size-200">
              SoulForge
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.href)
                    ? 'text-pink-400 bg-pink-500/10'
                    : 'text-muted-foreground hover:text-pink-300 hover:bg-pink-500/5'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <link.icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </span>
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-pink-300 hover:bg-pink-500/10 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 animate-fadeIn">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.href)
                    ? 'text-pink-400 bg-pink-500/10'
                    : 'text-muted-foreground hover:text-pink-300 hover:bg-pink-500/5'
                }`}
              >
                <link.icon className="h-5 w-5" />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
