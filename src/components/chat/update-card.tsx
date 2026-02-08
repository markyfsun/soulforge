"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, Heart, CheckCircle, XCircle } from "lucide-react"
import type { ToolCall, ToolResult } from "./tool-result-renderer"

interface UpdateCardProps {
  toolCall: ToolCall
  toolResult: ToolResult
}

// Args type from update_memory tool
interface UpdateMemoryArgs {
  content: string
  importance: number
}

// Args type from update_relationship tool
interface UpdateRelationshipArgs {
  target_oc_id: string
  score_change: number
  relationship_type?: "hostile" | "neutral" | "friendly" | "romantic"
}

// Result type from both tools
interface UpdateResult {
  success: boolean
  result: string
}

export function UpdateCard({ toolCall, toolResult }: UpdateCardProps) {
  const result = toolResult.result as unknown as UpdateResult
  const isSuccess = result.success

  // Determine if this is a memory or relationship update based on tool name
  const isMemoryUpdate = toolCall.toolName === "update_memory"
  const isRelationshipUpdate = toolCall.toolName === "update_relationship"

  if (isMemoryUpdate) {
    return <MemoryUpdateCard toolCall={toolCall} toolResult={toolResult} />
  }

  if (isRelationshipUpdate) {
    return <RelationshipUpdateCard toolCall={toolCall} toolResult={toolResult} />
  }

  // Generic update card
  return (
    <Card className="border-gray-200 bg-gray-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {isSuccess ? (
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700">{result.result || "Update processed"}</p>
          </div>
          <Badge variant={isSuccess ? "secondary" : "destructive"}>
            {isSuccess ? "Success" : "Failed"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function MemoryUpdateCard({ toolCall, toolResult }: UpdateCardProps) {
  const args = toolCall.args as unknown as UpdateMemoryArgs
  const result = toolResult.result as unknown as UpdateResult
  const isSuccess = result.success

  // Determine importance level styling
  const getImportanceColor = (importance: number) => {
    if (importance >= 8) return "text-red-600 bg-red-50 border-red-200"
    if (importance >= 5) return "text-amber-600 bg-amber-50 border-amber-200"
    return "text-blue-600 bg-blue-50 border-blue-200"
  }

  return (
    <Card className={`border-amber-200 bg-amber-50`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Brain className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-amber-800">Memory Stored</span>
              {args.importance && (
                <Badge
                  variant="secondary"
                  className={`text-xs ${getImportanceColor(args.importance)}`}
                >
                  Importance: {args.importance}/10
                </Badge>
              )}
            </div>
            <p className="text-sm text-amber-700 italic line-clamp-3">
              "{args.content}"
            </p>
            {isSuccess && result.result && (
              <p className="text-xs text-amber-600 mt-2">{result.result}</p>
            )}
          </div>
          {isSuccess ? (
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function RelationshipUpdateCard({ toolCall, toolResult }: UpdateCardProps) {
  const args = toolCall.args as unknown as UpdateRelationshipArgs
  const result = toolResult.result as unknown as UpdateResult
  const isSuccess = result.success

  // Determine relationship type styling
  const getRelationshipColor = (
    type?: "hostile" | "neutral" | "friendly" | "romantic"
  ) => {
    switch (type) {
      case "hostile":
        return "bg-red-500"
      case "neutral":
        return "bg-gray-500"
      case "friendly":
        return "bg-blue-500"
      case "romantic":
        return "bg-pink-500"
      default:
        return "bg-gray-500"
    }
  }

  // Score change indicator
  const getScoreChangeColor = (change: number) => {
    if (change > 0) return "text-green-600"
    if (change < 0) return "text-red-600"
    return "text-gray-600"
  }

  const getScoreChangeIcon = (change: number) => {
    if (change > 0) return "+"
    if (change < 0) return ""
    return ""
  }

  return (
    <Card className={`border-pink-200 bg-pink-50`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Heart className="h-5 w-5 text-pink-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-sm font-medium text-pink-800">Relationship Updated</span>
              {args.relationship_type && (
                <Badge
                  variant="secondary"
                  className={`text-xs text-white ${getRelationshipColor(args.relationship_type)}`}
                >
                  {args.relationship_type}
                </Badge>
              )}
              {args.score_change !== undefined && (
                <Badge
                  variant="secondary"
                  className={`text-xs ${getScoreChangeColor(args.score_change)} bg-white border border-current`}
                >
                  {getScoreChangeIcon(args.score_change)}{args.score_change}
                </Badge>
              )}
            </div>
            <p className="text-xs text-pink-600 mb-1">
              Target OC: {args.target_oc_id.slice(0, 8)}...
            </p>
            {isSuccess && result.result && (
              <p className="text-sm text-pink-700">{result.result}</p>
            )}
          </div>
          {isSuccess ? (
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
