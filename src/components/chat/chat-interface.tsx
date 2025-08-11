'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ReloadIcon } from '@radix-ui/react-icons'
import { ChevronUpIcon, FileIcon, SparklesIcon } from 'lucide-react'
import { GeneratedFile, AIResponse } from '@/lib/ai'
import { useProjectStore } from '@/store/project-store'
import type { DiffOperation } from '@/lib/vfs'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  type?: 'prompt' | 'explanation' | 'suggestions' | 'files' | 'error'
  files?: GeneratedFile[]
  suggestions?: string[]
}

interface AgentToolResult {
  type: 'format' | 'typecheck' | 'tests'
  ok: boolean
  details: any
  durationMs: number
}

interface AgentExtras {
  diffPreview?: DiffOperation[]
  toolResults?: AgentToolResult[]
}

interface ChatInterfaceProps {
  onCodeGeneration: (response: AIResponse) => void
  onGenerationStart: () => void
}

export function ChatInterface({ onCodeGeneration, onGenerationStart }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [placeholderText, setPlaceholderText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [activeSuggestions, setActiveSuggestions] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { setLastPrompt, setChatMessages, addChatMessage, applyVfsDiff, setActiveView } = useProjectStore()

  const [agentToolResults, setAgentToolResults] = useState<AgentToolResult[] | null>(null)
  const [agentDiffPreview, setAgentDiffPreview] = useState<DiffOperation[] | null>(null)

  // Carregar histórico inicial do store (se houver)
  useEffect(() => {
    const savedRaw = localStorage.getItem('bilderama:chat')
    if (savedRaw) {
      try {
        const saved: ChatMessage[] = JSON.parse(savedRaw)
        setMessages(saved)
        setChatMessages(saved)
      } catch {}
    }
  }, [setChatMessages])

  // Persistir localStorage e store a cada mudança
  useEffect(() => {
    localStorage.setItem('bilderama:chat', JSON.stringify(messages))
    setChatMessages(messages)
  }, [messages, setChatMessages])

  // Auto-resize do textarea
  useEffect(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = '0px'
    const scrollH = textareaRef.current.scrollHeight
    textareaRef.current.style.height = Math.min(scrollH, 240) + 'px'
  }, [input])

  // Placeholder animado
  useEffect(() => {
    if (isTyping) return
    const phrases = [
      'O que você quer construir hoje?','Um site?','Um app?','Que tal um jogo?','Seja o que for, nós construímos pra você.'
    ]
    let currentPhrase = 0, currentChar = 0, typing = true, timeoutId: NodeJS.Timeout
    const animate = () => {
      const text = phrases[currentPhrase]
      if (typing) {
        setPlaceholderText(text.slice(0, currentChar++))
        if (currentChar > text.length) { typing = false; timeoutId = setTimeout(animate, 1000); return }
      } else {
        setPlaceholderText(text.slice(0, currentChar--))
        if (currentChar === 0) { typing = true; currentPhrase = (currentPhrase + 1) % phrases.length; timeoutId = setTimeout(animate, 500); return }
      }
      timeoutId = setTimeout(animate, typing ? 80 : 40)
    }
    timeoutId = setTimeout(animate, 300)
    return () => clearTimeout(timeoutId)
  }, [isTyping])

  const handleSubmit = async (content: string) => {
    if (!content.trim() || isLoading) return
    const userMessage: ChatMessage = { role: 'user', content }
    setMessages((prev) => [...prev, userMessage])
    addChatMessage(userMessage)
    setInput('')
    setIsTyping(false)
    setIsLoading(true)
    onGenerationStart()
    setActiveSuggestions([])

    // Guarda o último prompt para snapshots
    setLastPrompt(content)

    try {
      const { pagePlan, generatedFiles } = useProjectStore.getState();
      const requestBody = { userInput: content, currentPagePlan: pagePlan, currentFiles: generatedFiles }
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) })
      const result: AIResponse & AgentExtras = await response.json()
      if (!response.ok) throw new Error((result as any).error || `Erro da API: ${response.statusText}`)
      if (!result.pagePlanJson || !result.explanation) throw new Error('Resposta incompleta da API')
      onCodeGeneration(result)
      const assistant: ChatMessage = { role: 'assistant', content: result.explanation, type: 'explanation' }
      setMessages((prev) => [...prev, assistant])
      addChatMessage(assistant)
      if (result.suggestions && result.suggestions.length > 0) setActiveSuggestions(result.suggestions)
      // Extras do agente
      setAgentToolResults(result.toolResults || null)
      setAgentDiffPreview(result.diffPreview || null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro inesperado ao processar sua solicitação'
      const assistant: ChatMessage = { role: 'assistant', content: `Desculpe, mas encontrei um problema: ${errorMessage}. Por favor, tente novamente com um prompt diferente.`, type: 'error' }
      setMessages((prev) => [...prev, assistant])
      addChatMessage(assistant)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSubmit(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(input)
    }
  }

  const renderToolResults = () => {
    if (!agentToolResults || agentToolResults.length === 0) return null
    return (
      <div className="border-t px-4 py-3 text-xs text-muted-foreground flex flex-wrap gap-2 items-center">
        <span className="mr-1">Validações:</span>
        {agentToolResults.map((t, idx) => (
          <span key={idx} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 border ${t.ok ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : 'border-red-300 text-red-700 bg-red-50'}`}>
            <span className="font-medium">{t.type}</span>
            <span>({t.durationMs}ms)</span>
          </span>
        ))}
      </div>
    )
  }

  const renderDiffCta = () => {
    if (!agentDiffPreview || agentDiffPreview.length === 0) return null
    return (
      <div className="border-t px-4 py-3 flex items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">O agente propôs {agentDiffPreview.length} mudança(s) no workspace.</div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              try {
                await applyVfsDiff(agentDiffPreview)
                setActiveView('code')
              } catch {}
            }}
          >
            Aplicar mudanças sugeridas
          </Button>
        </div>
      </div>
    )
  }

  const renderMessageBubble = (message: ChatMessage, i: number) => (
    <div key={i} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-xl border px-4 py-2 ${message.role === 'user' ? 'bg-primary text-primary-foreground border-primary/30' : message.type === 'error' ? 'bg-destructive/10 border-destructive/30' : 'bg-card border-border/60'}`}>
        {message.role === 'user' ? (
          <pre className="whitespace-pre-wrap break-words text-sm">{message.content}</pre>
        ) : message.type === 'error' ? (
          <div className="space-y-2">
            <div className="font-medium text-destructive">❌ Erro:</div>
            <div className="text-sm text-destructive">{message.content}</div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="font-medium">✨ Resumo:</div>
            <div className="text-sm">{message.content}</div>
          </div>
        )}
      </div>
    </div>
  )

  const renderSuggestions = () => {
    if (activeSuggestions.length === 0) return null
    return (
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="overflow-x-auto px-4 py-3 flex gap-2 no-scrollbar">
          {activeSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSubmit(suggestion)}
              className="flex-none flex items-center gap-2 px-4 py-2 text-sm rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors whitespace-nowrap"
            >
              <SparklesIcon className="w-4 h-4" />
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-[92vh] flex-col bg-background">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(renderMessageBubble)}
      </div>

      {renderToolResults()}
      {renderDiffCta()}
      {renderSuggestions()}

      <form onSubmit={handleFormSubmit} className="sticky bottom-0 border-t px-4 pb-4 pt-2 bg-background">
        <div className="flex items-end gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-3 shadow-sm">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); setIsTyping(true) }}
            onBlur={() => setIsTyping(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText}
            className="min-h-[56px] flex-1 bg-transparent px-0 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 resize-none max-h-60"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" className="rounded-md shadow-sm h-10 w-10" disabled={isLoading} variant="default">
            {isLoading ? <ReloadIcon className="h-5 w-5 animate-spin" /> : <ChevronUpIcon className="h-5 w-5" />}
          </Button>
        </div>
      </form>
    </div>
  )
}
