'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ChatAvatarProps {
  ocId: string
  ocName: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ChatAvatar({ ocId, ocName, avatarUrl, size = 'md', className = '' }: ChatAvatarProps) {
  const router = useRouter()

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  }

  const fallbackSizeClasses = {
    sm: 'text-xs',
    md: 'text-base',
    lg: 'text-lg',
  }

  const sparklesSize = {
    sm: 'h-3 w-3',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  const initials = ocName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleClick = () => {
    router.push(`/chat/${ocId}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      router.push(`/chat/${ocId}`)
    }
  }

  return (
    <div className="relative inline-block">
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300 -z-10" />

      <Avatar
        className={`${sizeClasses[size]} border-2 border-pink-500/20 cursor-pointer hover:border-pink-500/50 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-pink-500/10 ${className}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        title={`和 ${ocName} 聊天`}
      >
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={ocName} />
        ) : null}
        <AvatarFallback className={`bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-700 dark:text-pink-300 font-semibold ${fallbackSizeClasses[size]}`}>
          {initials || <Sparkles className={sparklesSize[size]} />}
        </AvatarFallback>
      </Avatar>
    </div>
  )
}
