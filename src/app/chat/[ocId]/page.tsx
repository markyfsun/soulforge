"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, Send, ArrowLeft, Sparkles, Loader2, AlertCircle, Heart } from "lucide-react"
import { getUserId, getSessionId } from "@/lib/analytics/session-tracker"
import type { OC, Message as DBMessage, VisualStyle } from "@/types/database"
import { ToolResultRenderer } from "@/components/chat/tool-result-renderer"
import { ImageLightbox } from "@/components/ui/image-lightbox"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ChatMessage extends DBMessage {
  role: "user" | "assistant"
}

interface Item {
  id: string
  name: string
  description: string
  image_url: string | null
  personality_effects: string
  rarity: "common" | "rare" | "epic" | "legendary"
}

interface ChatData {
  success: boolean
  oc: OC
  messages: ChatMessage[]
  items: Item[]
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const ocId = params.ocId as string

  const [loading, setLoading] = useState(true)
  const [chatData, setChatData] = useState<ChatData | null>(null)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [showOCImage, setShowOCImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasRestoredMessages, setHasRestoredMessages] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Heartbeat trigger state
  const [isHeartbeatRunning, setIsHeartbeatRunning] = useState(false)
  const [heartbeatResult, setHeartbeatResult] = useState<string | null>(null)
  const [showHeartbeatDialog, setShowHeartbeatDialog] = useState(false)

  // Generate userId and sessionId
  const userId = getUserId()
  const sessionId = getSessionId()

  // Simple chat state (not using useChat to avoid complexity)
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const chatAbortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = async (text: string) => {
    if (!text.trim() || isChatLoading) return

    const userMessage = { role: 'user' as const, content: text }
    setChatMessages(prev => [...prev, userMessage])
    setIsChatLoading(true)

    try {
      const abortController = new AbortController()
      chatAbortControllerRef.current = abortController

      const response = await fetch(`/api/chat/${ocId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...chatMessages, userMessage] }),
        signal: abortController.signal,
      })

      console.log('[Chat Client] Response status:', response.status)

      if (!response.ok) throw new Error('Failed to send message')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let assistantMessage = { role: 'assistant' as const, content: '' }

      setChatMessages(prev => [...prev, assistantMessage])

      // Read the plain text stream from toTextStreamResponse()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })

        // toTextStreamResponse returns plain text, just append it
        assistantMessage.content += chunk
        setChatMessages(prev => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1] = { ...assistantMessage }
          return newMessages
        })
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Chat error:', error)
      }
    } finally {
      setIsChatLoading(false)
      chatAbortControllerRef.current = null
    }
  }

  const stop = () => {
    chatAbortControllerRef.current?.abort()
    setIsChatLoading(false)
  }

  // Trigger heartbeat for this OC
  const triggerHeartbeat = async () => {
    setIsHeartbeatRunning(true)
    setHeartbeatResult(null)

    try {
      const response = await fetch('/api/cron/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ocId }),
      })

      const data = await response.json()

      if (data.success) {
        const result = data.results?.[0]
        if (result) {
          const actions = result.actions
            .filter((a: any) => a.action !== 'end_heartbeat' && a.action !== 'no_action')
            .map((a: any) => `${a.action}: ${a.result}`)
            .join('\n')

          setHeartbeatResult(
            `${result.ocName} 完成了 ${result.actions.length} 个行动：\n${actions || '无行动'}`
          )

          // Refresh chat data to show any new posts/comments
          await fetchChatData()
        }
      } else {
        setHeartbeatResult(`错误: ${data.error}`)
      }
    } catch (err) {
      setHeartbeatResult(`错误: ${err instanceof Error ? err.message : '未知错误'}`)
    } finally {
      setIsHeartbeatRunning(false)
    }
  }

  // Use chatMessages instead of messages from useChat
  const messages = chatMessages.map((msg, i) => ({
    id: String(i),
    role: msg.role,
    content: msg.content,
  }))
  const status = isChatLoading ? 'streaming' : 'ready'
  const isLoading = isChatLoading
  const setMessages = setChatMessages

  const prevLoadingRef = useRef(false)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Detect loading state changes for analytics
  useEffect(() => {
    if (prevLoadingRef.current && !isLoading && messages.length > 0) {
      // Log analytics to console when streaming completes
      console.log('[Chat Analytics]', {
        userId,
        sessionId,
        messageCount: messages.length,
        timestamp: new Date().toISOString(),
      })
    }
    prevLoadingRef.current = isLoading
  }, [status, messages, userId, sessionId])

  // Load initial chat data (OC info, items, existing messages)
  useEffect(() => {
    fetchChatData()
  }, [ocId])

  // Restore messages from database on mount
  useEffect(() => {
    if (!hasRestoredMessages && chatData?.messages) {
      // Only restore messages that have actual content
      const mappedMessages = chatData.messages
        .filter(msg => msg.content && msg.content.trim() !== '')
        .map((msg) => ({
          id: msg.id,
          role: (msg.sender_type === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: msg.content,
        }))

      setChatMessages(mappedMessages)
      setHasRestoredMessages(true)
    }
  }, [chatData, hasRestoredMessages])

  const fetchChatData = async () => {
    try {
      const supabase = await createClient()

      // Fetch OC data
      const { data: oc, error: ocError } = await supabase
        .from('ocs')
        .select('*')
        .eq('id', ocId)
        .single()

      if (ocError || !oc) {
        throw new Error('OC not found')
      }

      // Fetch OC's items (fetch regardless of conversation existence)
      const { data: inventory, error: inventoryError } = await supabase
        .from('oc_inventory')
        .select('item_id, oc_items(*)')
        .eq('oc_id', ocId)

      console.log('[Chat] Inventory fetch:', {
        inventoryCount: inventory?.length || 0,
        inventoryError: inventoryError?.message,
        inventoryData: inventory,
      })

      const items =
        inventory?.map((inv: any) => ({
          ...inv.oc_items,
          personality_effects: inv.oc_items.personality_effects,
        })) || []

      console.log('[Chat] Mapped items:', {
        itemsCount: items.length,
        items: items.map(i => ({ id: i.id, name: i.name, hasImage: !!i.image_url }))
      })

      // Fetch conversation
      const { data: conversations } = await supabase
        .from('conversations')
        .select('*')
        .eq('oc_id', ocId)
        .order('updated_at', { ascending: false })
        .limit(1)

      if (!conversations || conversations.length === 0) {
        // No conversation exists, return empty data but with items
        setChatData({
          success: true,
          oc,
          messages: [],
          items,  // ✅ Now includes items even without conversation
        })
        setLoading(false)
        return
      }

      const conversation = conversations[0]

      // Fetch messages
      const { data: dbMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true })

      setChatData({
        success: true,
        oc,
        messages: dbMessages || [],
        items,
      })
    } catch (err) {
      console.error('Error fetching chat data:', err)
      setError('Failed to load chat data')
    } finally {
      setLoading(false)
    }
  }

  const getRarityBgClass = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-emerald-400'
      case 'rare': return 'bg-blue-500'
      case 'epic': return 'bg-purple-500'
      case 'legendary': return 'bg-yellow-400'
      default: return 'bg-emerald-400'
    }
  }

  const getRarityBorderClass = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-emerald-600'
      case 'rare': return 'border-blue-700'
      case 'epic': return 'border-purple-700'
      case 'legendary': return 'border-yellow-600'
      default: return 'border-emerald-600'
    }
  }

  const getRarityTextClass = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-emerald-900'
      case 'rare': return 'text-blue-900'
      case 'epic': return 'text-purple-900'
      case 'legendary': return 'text-yellow-900'
      default: return 'text-emerald-900'
    }
  }

  // Custom submit handler to clear input and validate
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const trimmedInput = input.trim()
    setInput('')
    sendMessage(trimmedInput)
  }

  // Render tool invocations from useChat messages
  const renderToolInvocations = (message: any) => {
    // The new SDK format uses 'parts' array with tool-related parts
    if (!message.parts || message.parts.length === 0) return null

    return message.parts
      .filter((part: any) => part.type === 'tool-call' || part.type.startsWith('tool-'))
      .map((part: any, index: number) => {
        // Check if we have a result for this tool call
        const correspondingResult = message.parts.find((p: any) =>
          p.type === 'tool-result' && p.toolCallId === part.toolCallId
        )

        if (correspondingResult) {
          return (
            <ToolResultRenderer
              key={part.toolCallId || index}
              toolCall={{
                toolCallId: part.toolCallId,
                toolName: part.toolName || part.toolName,
                args: part.args,
              }}
              toolResult={{
                toolCallId: correspondingResult.toolCallId,
                result: correspondingResult.result,
              }}
            />
          )
        }

        // Show pending tool call without result
        return (
          <Card key={part.toolCallId || index} className="border-amber-200 bg-amber-50 mb-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 text-amber-700 animate-spin" />
                <span className="text-sm font-medium text-amber-800">
                  Calling: {part.toolName}
                </span>
              </div>
            </CardContent>
          </Card>
        )
      })
  }

  const renderMessage = (message: any) => {
    const isUser = message.role === 'user'

    // Debug log to see what messages we're rendering
    const contentPreview = message.content
      ? typeof message.content === 'string'
        ? message.content.substring(0, 50)
        : JSON.stringify(message.content).substring(0, 100)
      : 'no content'

    console.log('[Chat] Rendering message:', {
      id: message.id,
      role: message.role,
      hasContent: !!message.content,
      contentType: typeof message.content,
      contentPreview,
      hasParts: !!message.parts,
      partsCount: message.parts?.length,
    })

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
          {/* Render tool invocations for assistant messages */}
          {!isUser && renderToolInvocations(message)}

          {message.content && (
            <Card className={isUser ? 'bg-slate-800/90 text-white border-slate-600' : 'bg-white/90 text-slate-900 border-slate-300 shadow-lg'}>
              <CardContent className="p-4">
                {isUser ? (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <div className="text-sm prose prose-slate dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        code: ({ children, className, ...props }) =>
                          className?.includes('inline') ? (
                            <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-sm" {...props}>{children}</code>
                          ) : (
                            <code className="block bg-slate-200 dark:bg-slate-700 p-2 rounded text-sm overflow-x-auto" {...props}>{children}</code>
                          ),
                        pre: ({ children }) => <pre className="bg-slate-200 dark:bg-slate-700 p-3 rounded-lg overflow-x-auto mb-2">{children}</pre>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        a: ({ href, children }) => (
                          <a href={href} className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
                            {children}
                          </a>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-slate-400 dark:border-slate-600 pl-4 italic my-2">
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <div className="text-center">
          <Skeleton className="w-64 h-64 mx-auto mb-4 rounded-full" />
          <Skeleton className="w-48 h-8 mx-auto" />
        </div>
      </div>
    )
  }

  if (error || !chatData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || '加载聊天数据失败'}</p>
          <Button onClick={() => router.push('/forum')} variant="outline" className="text-white border-white/20">
            返回论坛
          </Button>
        </div>
      </div>
    )
  }

  const { oc, items } = chatData
  const visualStyle = (oc.visual_style as VisualStyle | null) || undefined

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        background: visualStyle?.background || 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)',
      }}
    >
      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      {/* Background image layer - OC's image as subtle background */}
      {oc.avatar_url && (
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `url(${oc.avatar_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(60px)',
          }}
        />
      )}

      {/* Header */}
      <div className="relative z-10 p-4 border-b border-white/30 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/forum')}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              {oc.name}
              <Sparkles className="h-4 w-4 text-yellow-300" />
            </h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowHeartbeatDialog(true)
              triggerHeartbeat()
            }}
            disabled={isHeartbeatRunning}
            className="text-white hover:bg-white/20 border border-white/20"
            title="手动触发心跳唤醒"
          >
            {isHeartbeatRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                唤醒中...
              </>
            ) : (
              <>
                <Heart className="h-4 w-4 mr-2" />
                唤醒
              </>
            )}
          </Button>
        </div>
      </div>

      {/* OC Avatar and Items Display at Top */}
      <div className="relative z-10 px-4 py-3 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-3xl mx-auto">
          {/* OC Avatar and Name */}
          <div className="flex items-center gap-4 mb-3">
            <Avatar
              className="w-16 h-16 border-3 border-white/40 shadow-2xl cursor-pointer hover:scale-110 transition-transform flex-shrink-0"
              onClick={() => oc.avatar_url && setShowOCImage(true)}
            >
              <AvatarImage src={oc.avatar_url || undefined} />
              <AvatarFallback className="text-white bg-black/30 text-xl">
                {oc.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-white">{oc.name}</h2>
              <p className="text-white/60 text-sm truncate">{oc.description}</p>
            </div>
          </div>

          {/* Items - Horizontal Scroll */}
          {items.length > 0 && (
            <div className="relative">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex-shrink-0 transition-transform`}
                  >
                    <div
                      onClick={() => setSelectedItem(item)}
                      className={`cursor-pointer hover:scale-110 transition-transform relative w-12 h-12 rounded-lg ${getRarityBgClass(item.rarity)} border-2 ${getRarityBorderClass(item.rarity)} shadow-lg flex items-center justify-center`}
                    >
                      {item.image_url ? (
                        <div onClick={(e) => e.stopPropagation()} className="w-full h-full">
                          <ImageLightbox
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full rounded-lg object-cover"
                          >
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full rounded-lg object-cover cursor-zoom-in"
                              title="点击查看大图"
                            />
                          </ImageLightbox>
                        </div>
                      ) : (
                        <span className={`text-sm font-bold ${getRarityTextClass(item.rarity)}`}>{item.name.charAt(0)}</span>
                      )}
                      <div className={`absolute -bottom-1 -right-1 text-[8px] px-1 h-3 min-w-3 flex items-center justify-center rounded-full ${getRarityBgClass(item.rarity)} ${getRarityTextClass(item.rarity)} border ${getRarityBorderClass(item.rarity)}`}>
                        {item.rarity.slice(0, 1).toUpperCase()}
                      </div>
                    </div>
                    <p
                      onClick={() => setSelectedItem(item)}
                      className="text-white/60 text-xs text-center mt-1 truncate w-12 cursor-pointer hover:text-white transition-colors"
                      title="点击查看详情"
                    >
                      {item.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Messages Area */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Messages Area - Scrollable, semi-transparent */}
        <ScrollArea className="flex-1 px-4 py-2">
          <div className="max-w-3xl mx-auto pb-4">
            {messages.length === 0 ? (
              <div className="text-center text-white/80 py-12">
                <Avatar className="w-24 h-24 mx-auto mb-6 border-4 border-white/30">
                  <AvatarImage src={oc.avatar_url || undefined} />
                  <AvatarFallback className="text-white bg-black/30 text-3xl">
                    {oc.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-semibold text-white mb-2">{oc.name}</h2>
                <p className="text-white/70 mb-6 max-w-md mx-auto">{oc.description}</p>
                <div className="flex items-center justify-center gap-2 text-white/60">
                  <MessageSquare className="w-5 h-5" />
                  <p>和 {oc.name} 开始对话...</p>
                </div>
              </div>
            ) : (
              messages.map(renderMessage)
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-white/20 bg-black/10 backdrop-blur-sm">
          <form onSubmit={onSubmit} className="max-w-3xl mx-auto flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`和 ${oc.name} 聊聊...`}
              className="flex-1 px-4 py-3 rounded-full bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:border-white/60 focus:bg-white/30 transition-all disabled:opacity-50"
              disabled={isLoading}
            />
            <Button
              type="button"
              onClick={isLoading ? stop : undefined}
              disabled={!input.trim() || isLoading}
              className={isLoading ? "rounded-full bg-red-500/80 hover:bg-red-500 text-white px-6" : "rounded-full bg-white text-purple-900 hover:bg-white/90 px-6"}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  停止
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  发送
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Item Detail Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-sm border-slate-700 text-white">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-white">
                  <div className={`w-14 h-14 rounded-full ${getRarityBgClass(selectedItem.rarity)} border-3 ${getRarityBorderClass(selectedItem.rarity)} flex items-center justify-center shadow-lg`}>
                    {selectedItem.image_url ? (
                      <div onClick={(e) => e.stopPropagation()} className="w-full h-full">
                        <ImageLightbox
                          src={selectedItem.image_url}
                          alt={selectedItem.name}
                          className="w-full h-full rounded-full object-cover cursor-zoom-in"
                        >
                          <img
                            src={selectedItem.image_url}
                            alt={selectedItem.name}
                            className="w-full h-full rounded-full object-cover cursor-zoom-in"
                            title="点击查看大图"
                          />
                        </ImageLightbox>
                      </div>
                    ) : (
                      <span className={`text-xl font-bold ${getRarityTextClass(selectedItem.rarity)}`}>{selectedItem.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{selectedItem.name}</div>
                    <div className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${getRarityBgClass(selectedItem.rarity)} ${getRarityTextClass(selectedItem.rarity)} border ${getRarityBorderClass(selectedItem.rarity)}`}>
                      {selectedItem.rarity.toUpperCase()}
                    </div>
                  </div>
                </DialogTitle>
                <DialogDescription className="text-base text-slate-200">
                  {selectedItem.description}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2 text-white">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    性格影响
                  </h4>
                  <p className="text-sm text-slate-300 bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                    {selectedItem.personality_effects}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* OC Image Modal */}
      <Dialog open={showOCImage} onOpenChange={setShowOCImage}>
        <DialogContent className="max-w-3xl bg-transparent border-none">
          <DialogTitle className="sr-only">{oc.name} - Full Image</DialogTitle>
          <DialogDescription className="sr-only">Full size image of {oc.name}</DialogDescription>
          {oc.avatar_url && (
            <div className="relative">
              <img
                src={oc.avatar_url}
                alt={oc.name}
                className="w-full rounded-lg shadow-2xl"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowOCImage(false)}
                className="absolute -top-4 -right-4 bg-white/90 hover:bg-white text-black rounded-full"
              >
                ✕
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Heartbeat Result Modal */}
      <Dialog open={showHeartbeatDialog} onOpenChange={setShowHeartbeatDialog}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-sm border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Heart className="h-5 w-5 text-red-400" />
              {oc.name} 的心跳唤醒
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {isHeartbeatRunning ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                <span className="ml-3 text-white/80">正在唤醒 {oc.name}...</span>
              </div>
            ) : heartbeatResult ? (
              <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700 max-h-64 overflow-y-auto">
                <pre className="text-sm text-slate-200 whitespace-pre-wrap">{heartbeatResult}</pre>
              </div>
            ) : null}
          </div>
          <div className="flex justify-end mt-4">
            <Button
              onClick={() => setShowHeartbeatDialog(false)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              关闭
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}