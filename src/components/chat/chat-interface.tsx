'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ReloadIcon } from '@radix-ui/react-icons'
import { ChevronUpIcon, FileIcon, SparklesIcon } from 'lucide-react'
import { GeneratedFile, AIResponse } from '@/lib/ai'
import { useProjectStore } from '@/store/project-store'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  type?: 'prompt' | 'explanation' | 'suggestions' | 'files' | 'error'
  files?: GeneratedFile[]
  suggestions?: string[]
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
    setInput('')
    setIsTyping(false)
    setIsLoading(true)
    onGenerationStart()
    setActiveSuggestions([])
    try {
      const { pagePlan } = useProjectStore.getState();
      const requestBody = { userInput: content, currentPagePlan: pagePlan }
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) })
      const result: AIResponse = await response.json()
      if (!response.ok) throw new Error((result as any).error || `Erro da API: ${response.statusText}`)
      if (!result.pagePlanJson || !result.explanation) throw new Error('Resposta incompleta da API')
      onCodeGeneration(result)
      setMessages((prev) => [...prev, { role: 'assistant', content: result.explanation, type: 'explanation' }])
      if (result.suggestions && result.suggestions.length > 0) setActiveSuggestions(result.suggestions)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro inesperado ao processar sua solicitação'
      setMessages((prev) => [...prev, { role: 'assistant', content: `Desculpe, mas encontrei um problema: ${errorMessage}. Por favor, tente novamente com um prompt diferente.`, type: 'error' }])
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
