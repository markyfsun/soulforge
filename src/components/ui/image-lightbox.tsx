'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageLightboxProps {
  src: string
  alt?: string
  children?: React.ReactNode
  className?: string
}

/**
 * Image component that opens in a lightbox when clicked
 */
export function ImageLightbox({ src, alt, children, className = '' }: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Use the provided children or default img
  const trigger = children || (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setImageError(true)}
    />
  )

  if (imageError) {
    return <>{trigger}</>
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer hover:opacity-90 transition-opacity inline-block">
          {trigger}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-5xl w-full p-0 bg-transparent border-none">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-10 right-0 text-white hover:bg-white/20"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>
          <img
            src={src}
            alt={alt}
            className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
