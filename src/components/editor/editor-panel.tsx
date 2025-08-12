'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useProjectStore } from '@/store/project-store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [content, setContent] = useState('')
  const [linkValue, setLinkValue] = useState('')
  const [imageValue, setImageValue] = useState('')
  const pagePlan = useProjectStore((s) => s.pagePlan)
  const updateToken = useProjectStore((s) => s.updateDesignToken)

  const parsedSelection = useMemo(() => {
    if (!selectedElement) return null
    const [blockIndexStr, propKey] = selectedElement.id.split(':')
    const blockIndex = Number(blockIndexStr)
    if (Number.isNaN(blockIndex) || !propKey) return null
    return { blockIndex, propKey }
  }, [selectedElement])

  useEffect(() => {
    if (!selectedElement) return
    setContent(selectedElement.innerText || '')

    // Deriva valores atuais do plano (quando disponível)
    if (pagePlan && parsedSelection) {
      const block = pagePlan.blocks?.[parsedSelection.blockIndex]
      const props: Record<string, any> | undefined = block?.properties as any
      if (props) {
        // Heurística: se for texto tipo XYZText, tenta par XYZHref
        const base = parsedSelection.propKey.replace(/Text$/, '')
        const maybeHrefKey = `${base}Href`
        const maybeSrcKey = `${base}Src`

        if (typeof props[maybeHrefKey] === 'string') setLinkValue(props[maybeHrefKey] as string)
        else setLinkValue('')

        if (typeof props[maybeSrcKey] === 'string') setImageValue(props[maybeSrcKey] as string)
        else setImageValue('')
      }
    } else {
      setLinkValue('')
      setImageValue('')
    }
  }, [selectedElement, pagePlan, parsedSelection])

  if (!selectedElement) {
    return null;
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedElement || !parsedSelection) return
    // Atualiza a prop principal
    onUpdate(`${parsedSelection.blockIndex}:${parsedSelection.propKey}`, content)

    // Heurística: atualiza par Href se aplicável
    const base = parsedSelection.propKey.replace(/Text$/, '')
    if (linkValue && base !== parsedSelection.propKey) {
      onUpdate(`${parsedSelection.blockIndex}:${base}Href`, linkValue)
    }
    // Heurística: atualiza par Src se aplicável
    if (imageValue && base !== parsedSelection.propKey) {
      onUpdate(`${parsedSelection.blockIndex}:${base}Src`, imageValue)
    }
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
            {parsedSelection && selectedElement.tagName === 'A' && (
              <div>
                <Label htmlFor="link">Link (Href)</Label>
                <Input
                  id="link"
                  name="link"
                  value={linkValue}
                  onChange={(e) => setLinkValue(e.target.value)}
                  placeholder="/caminho-ou-url"
                />
              </div>
            )}
            {parsedSelection && /image|img|src/i.test(parsedSelection.propKey) && (
              <div>
                <Label htmlFor="image">Imagem (Src)</Label>
                <Input
                  id="image"
                  name="image"
                  value={imageValue}
                  onChange={(e) => setImageValue(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}
            {parsedSelection && (
              <div className="space-y-2 border-t pt-3">
                <div className="text-xs font-medium text-muted-foreground">Design Tokens</div>
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <Label className="text-xs">Card Style</Label>
                    <Select onValueChange={(v) => updateToken(parsedSelection.blockIndex, 'cardStyle', v)}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="(omitir)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="elevated">elevated</SelectItem>
                        <SelectItem value="outline">outline</SelectItem>
                        <SelectItem value="glass">glass</SelectItem>
                        <SelectItem value="minimal">minimal</SelectItem>
                        <SelectItem value="bold">bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Spacing</Label>
                    <Select onValueChange={(v) => updateToken(parsedSelection.blockIndex, 'spacing', v)}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="(omitir)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">compact</SelectItem>
                        <SelectItem value="comfortable">comfortable</SelectItem>
                        <SelectItem value="spacious">spacious</SelectItem>
                        <SelectItem value="extra-spacious">extra-spacious</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Emphasis</Label>
                    <Select onValueChange={(v) => updateToken(parsedSelection.blockIndex, 'emphasis', v)}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="(omitir)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">primary</SelectItem>
                        <SelectItem value="accent">accent</SelectItem>
                        <SelectItem value="neutral">neutral</SelectItem>
                        <SelectItem value="muted">muted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Border Radius</Label>
                    <Select onValueChange={(v) => updateToken(parsedSelection.blockIndex, 'borderRadius', v)}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="(omitir)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">none</SelectItem>
                        <SelectItem value="small">small</SelectItem>
                        <SelectItem value="medium">medium</SelectItem>
                        <SelectItem value="large">large</SelectItem>
                        <SelectItem value="full">full</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Shadow Intensity</Label>
                    <Select onValueChange={(v) => updateToken(parsedSelection.blockIndex, 'shadowIntensity', v)}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="(omitir)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">none</SelectItem>
                        <SelectItem value="soft">soft</SelectItem>
                        <SelectItem value="medium">medium</SelectItem>
                        <SelectItem value="strong">strong</SelectItem>
                        <SelectItem value="dramatic">dramatic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Animation</Label>
                    <Select onValueChange={(v) => updateToken(parsedSelection.blockIndex, 'animation', v)}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="(omitir)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">none</SelectItem>
                        <SelectItem value="subtle">subtle</SelectItem>
                        <SelectItem value="smooth">smooth</SelectItem>
                        <SelectItem value="bouncy">bouncy</SelectItem>
                        <SelectItem value="dramatic">dramatic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            <Button type="submit" className="w-full">Atualizar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 