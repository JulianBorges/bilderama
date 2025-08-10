"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ChatInterface } from "./chat-interface"
import { ProjectHistory } from "@/components/history/project-history"

interface ChatPanelProps {
  onCodeGeneration: (response: any) => void
  onGenerationStart: () => void
}

export function ChatPanel({ onCodeGeneration, onGenerationStart }: ChatPanelProps) {
  return (
    <Tabs defaultValue="chat" className="flex h-[92vh] flex-col">
      <div className="border-b px-4 pt-3">
        <TabsList>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="chat" className="m-0 flex-1">
        <ChatInterface onCodeGeneration={onCodeGeneration} onGenerationStart={onGenerationStart} />
      </TabsContent>
      <TabsContent value="history" className="m-0 flex-1 overflow-auto">
        <ProjectHistory />
      </TabsContent>
    </Tabs>
  )
} 