"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Image as ImageIcon, Sparkles, Loader2 } from "lucide-react"
import { useState } from "react"
import type { ToolCall, ToolResult } from "./tool-result-renderer"

interface ImageGenerationCardProps {
  toolCall: ToolCall
  toolResult: ToolResult
}

// Args type from generate_item_image tool
interface GenerateImageArgs {
  item_id: string
  prompt: string
}

// Result type from generate_item_image tool
interface GenerateImageResult {
  success: boolean
  result: string
  image_url?: string
}

export function ImageGenerationCard({ toolCall, toolResult }: ImageGenerationCardProps) {
  const args = toolCall.args as unknown as GenerateImageArgs
  const result = toolResult.result as unknown as GenerateImageResult

  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const imageUrl = result.image_url
  const isSuccess = result.success
  const isLoading = !result

  return (
    <Card className="border-green-200 bg-green-50 overflow-hidden">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 text-green-600 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4 text-green-600" />
            )}
            <span className="text-sm font-medium text-green-800">
              {isLoading ? "Generating Image..." : "Image Generated"}
            </span>
          </div>
          <Badge
            variant={isSuccess ? "secondary" : "destructive"}
            className={isSuccess ? "bg-green-200 text-green-800" : ""}
          >
            {isSuccess ? "Complete" : "Failed"}
          </Badge>
        </div>

        {/* Prompt */}
        <div className="mb-3">
          <p className="text-xs text-green-600 font-medium mb-1">Prompt:</p>
          <p className="text-sm text-green-700/80 italic line-clamp-2">
            "{args.prompt}"
          </p>
        </div>

        {/* Image display */}
        {imageUrl && !imageError && (
          <div className="relative rounded-lg overflow-hidden border-2 border-green-200 bg-white">
            {!imageLoaded && (
              <div className="aspect-square flex items-center justify-center bg-green-100">
                <Loader2 className="h-8 w-8 text-green-400 animate-spin" />
              </div>
            )}
            <img
              src={imageUrl}
              alt="Generated item image"
              className={`w-full h-auto transition-opacity duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true)
                setImageLoaded(true)
              }}
            />
          </div>
        )}

        {/* Error state */}
        {imageError && (
          <div className="aspect-square flex flex-col items-center justify-center bg-green-100 rounded-lg border-2 border-dashed border-green-300">
            <ImageIcon className="h-8 w-8 text-green-400 mb-2" />
            <p className="text-sm text-green-600">Image not available</p>
          </div>
        )}

        {/* Result message */}
        {isSuccess && result.result && (
          <div className="mt-3 pt-3 border-t border-green-200">
            <p className="text-xs text-green-600 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {result.result}
            </p>
          </div>
        )}

        {/* Item ID reference */}
        <div className="mt-2 text-xs text-green-500/60">
          Item ID: {args.item_id.slice(0, 8)}...
        </div>
      </CardContent>
    </Card>
  )
}
