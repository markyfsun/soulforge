"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, MessageCircle, Image, Gift, Brain, Heart } from "lucide-react"
import Link from "next/link"
import { PostPreviewCard } from "./post-preview-card"
import { GiftCard } from "./gift-card"
import { ImageGenerationCard } from "./image-generation-card"
import { UpdateCard } from "./update-card"

// Tool call and result types based on Vercel AI SDK format
export interface ToolCall {
  toolCallId: string
  toolName: string
  args: Record<string, unknown>
}

export interface ToolResult {
  toolCallId: string
  result: string | Record<string, unknown>
}

export interface ToolResultRendererProps {
  toolCall: ToolCall
  toolResult: ToolResult
}

// Tool name to component mapping
const TOOL_COMPONENTS: Record<string, React.ElementType> = {
  create_post: PostPreviewCard,
  gift_item: GiftCard,
  generate_item_image: ImageGenerationCard,
  update_memory: UpdateCard,
  update_relationship: UpdateCard,
}

// Tool metadata
const TOOL_METADATA: Record<
  string,
  { icon: React.ElementType; label: string; color: string; bgColor: string }
> = {
  create_post: {
    icon: MessageCircle,
    label: "Forum Post Created",
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
  },
  gift_item: {
    icon: Gift,
    label: "Item Gifted",
    color: "text-purple-700",
    bgColor: "bg-purple-50 border-purple-200",
  },
  generate_item_image: {
    icon: Image,
    label: "Image Generated",
    color: "text-green-700",
    bgColor: "bg-green-50 border-green-200",
  },
  update_memory: {
    icon: Brain,
    label: "Memory Updated",
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200",
  },
  update_relationship: {
    icon: Heart,
    label: "Relationship Updated",
    color: "text-pink-700",
    bgColor: "bg-pink-50 border-pink-200",
  },
}

export function ToolResultRenderer({ toolCall, toolResult }: ToolResultRendererProps) {
  const toolName = toolCall.toolName
  const Component = TOOL_COMPONENTS[toolName]
  const metadata = TOOL_METADATA[toolName]

  // If we have a specific component for this tool, use it
  if (Component && metadata) {
    const Icon = metadata.icon

    return (
      <div className="mb-4">
        <div className={`flex items-center gap-2 mb-2 px-2`}>
          <Icon className={`h-4 w-4 ${metadata.color}`} />
          <span className={`text-sm font-medium ${metadata.color}`}>
            {metadata.label}
          </span>
        </div>
        <Component toolCall={toolCall} toolResult={toolResult} />
      </div>
    )
  }

  // Fallback for unknown tools
  return <UnknownToolCard toolCall={toolCall} toolResult={toolResult} />
}

// Fallback component for unknown tools
function UnknownToolCard({
  toolCall,
  toolResult,
}: {
  toolCall: ToolCall
  toolResult: ToolResult
}) {
  return (
    <Card className="border-gray-200 bg-gray-50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-gray-700" />
          <span className="text-sm font-medium text-gray-800">
            {toolCall.toolName}
          </span>
          <Badge variant="secondary" className="ml-auto">
            Unknown Tool
          </Badge>
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-gray-700">Arguments:</span>
            <pre className="mt-1 p-2 bg-white rounded border border-gray-200 overflow-x-auto">
              {JSON.stringify(toolCall.args, null, 2)}
            </pre>
          </div>
          <div>
            <span className="font-medium text-gray-700">Result:</span>
            <pre className="mt-1 p-2 bg-white rounded border border-gray-200 overflow-x-auto">
              {JSON.stringify(toolResult.result, null, 2)}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
