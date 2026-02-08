"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, ExternalLink } from "lucide-react"
import Link from "next/link"
import type { ToolCall, ToolResult } from "./tool-result-renderer"

interface PostPreviewCardProps {
  toolCall: ToolCall
  toolResult: ToolResult
}

// Result type from create_post tool
interface CreatePostResult {
  success: boolean
  result: string
  post_id?: string
}

export function PostPreviewCard({ toolCall, toolResult }: PostPreviewCardProps) {
  const args = toolCall.args as { title: string; content: string }
  const result = toolResult.result as unknown as CreatePostResult

  const postId = result.post_id
  const isSuccess = result.success

  return (
    <Link
      href={postId ? `/forum/post/${postId}` : "/forum"}
      className="block"
    >
      <Card className="group hover:border-blue-400 hover:shadow-md hover:shadow-blue-100 transition-all cursor-pointer border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-base group-hover:text-blue-700 transition-colors truncate">
                  {args.title}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-600/80">
                <span>Posted to forum</span>
                {postId && (
                  <>
                    <span>·</span>
                    <Badge variant="secondary" className="text-xs">
                      Published
                    </Badge>
                  </>
                )}
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-blue-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-blue-700/80 line-clamp-3">
            {args.content}
          </p>

          {isSuccess && result.result && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs text-blue-600 flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {result.result}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
