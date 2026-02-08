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
    <Avatar
      className={`${sizeClasses[size]} border-2 border-primary/20 cursor-pointer hover:border-primary transition-colors ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      title={`和 ${ocName} 聊天`}
    >
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt={ocName} />
      ) : null}
      <AvatarFallback className={`bg-primary/10 text-primary ${fallbackSizeClasses[size]}`}>
        {initials || <Sparkles className={sparklesSize[size]} />}
      </AvatarFallback>
    </Avatar>
  )
}
