'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface EditorPanelProps {
  selectedElement: {
    id: string;
    tagName: string;
    innerText: string;
  } | null;
  onUpdate: (id: string, newContent: string) => void;
  onClose: () => void;
}

export function EditorPanel({ selectedElement, onUpdate, onClose }: EditorPanelProps) {
  const [content, setContent] = useState('');

  useEffect(() => {
    if (selectedElement) {
      setContent(selectedElement.innerText);
    }
  }, [selectedElement]);

  if (!selectedElement) {
    return null;
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    onUpdate(selectedElement.id, content);
  }

  return (
    <div className="absolute right-0 top-0 z-10 h-full w-80 border-l bg-background shadow-lg">
      <Card className="h-full rounded-none border-0">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>Editar Elemento</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            &times;
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="element-id" className="text-xs text-muted-foreground">ID do Elemento</Label>
              <p id="element-id" className="text-sm font-mono">{selectedElement.id}</p>
            </div>
            <div>
              <Label htmlFor="content">Conteúdo do Texto</Label>
              <Input 
                id="content" 
                name="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Novo texto..." />
            </div>
            <Button type="submit" className="w-full">Atualizar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 