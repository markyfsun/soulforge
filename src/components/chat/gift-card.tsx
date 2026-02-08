"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Gift, ArrowRight } from "lucide-react"
import type { ToolCall, ToolResult } from "./tool-result-renderer"

interface GiftCardProps {
  toolCall: ToolCall
  toolResult: ToolResult
}

// Args type from gift_item tool
interface GiftItemArgs {
  item_id: string
  recipient_oc_id: string
}

// Result type from gift_item tool
interface GiftItemResult {
  success: boolean
  result: string
}

// For fetching additional item/recipient details
// In a real implementation, you might fetch these from Supabase
interface ItemDetails {
  id: string
  name: string
  image_url: string | null
  rarity: "common" | "rare" | "epic" | "legendary"
}

interface RecipientDetails {
  id: string
  name: string
  avatar_url: string | null
}

export function GiftCard({ toolCall, toolResult }: GiftCardProps) {
  const args = toolCall.args as unknown as GiftItemArgs
  const result = toolResult.result as unknown as GiftItemResult

  const isSuccess = result.success

  // These would typically be fetched from Supabase based on IDs
  // For now, we'll use a placeholder display
  const getRarityColor = (rarity: string = "common") => {
    switch (rarity) {
      case "common":
        return "bg-gray-500"
      case "rare":
        return "bg-blue-500"
      case "epic":
        return "bg-purple-500"
      case "legendary":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Sender (current OC) */}
          <div className="flex-shrink-0">
            <Avatar className="h-10 w-10 border-2 border-purple-300">
              <AvatarFallback className="bg-purple-100 text-purple-700">
                <Gift className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Arrow icon */}
          <ArrowRight className="h-5 w-5 text-purple-400 flex-shrink-0" />

          {/* Gift item */}
          <div className="flex-shrink-0">
            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-purple-300">
                <AvatarFallback className={getRarityColor()}>
                  <Gift className="h-6 w-6 text-white" />
                </AvatarFallback>
              </Avatar>
              <Badge
                variant="secondary"
                className="absolute -top-1 -right-1 text-xs bg-purple-200 text-purple-800"
              >
                Gift
              </Badge>
            </div>
          </div>

          {/* Arrow icon */}
          <ArrowRight className="h-5 w-5 text-purple-400 flex-shrink-0" />

          {/* Recipient */}
          <div className="flex-1 min-w-0">
            <Avatar className="h-10 w-10 border-2 border-purple-300">
              <AvatarFallback className="bg-purple-100 text-purple-700">
                {args.recipient_oc_id.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Message */}
        {isSuccess && result.result && (
          <div className="mt-3 pt-3 border-t border-purple-200">
            <p className="text-sm text-purple-700">
              {result.result}
            </p>
          </div>
        )}

        {/* Item ID reference (for debugging) */}
        <div className="mt-2 text-xs text-purple-500/60">
          Item ID: {args.item_id.slice(0, 8)}...
        </div>
      </CardContent>
    </Card>
  )
}
