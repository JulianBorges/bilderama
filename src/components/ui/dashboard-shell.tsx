"use client"

import { ReactNode, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { QuickNav } from '@/components/dashboard/quick-nav'
import { useProjectStore } from '@/store/project-store'
import { Settings } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'

interface DashboardShellProps {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { generatedFiles, projectName, setProjectName, resetProject, saveCurrentSnapshot } = useProjectStore()

  useEffect(() => {
    const saved = localStorage.getItem('bilderama:project-name')
    if (saved) setProjectName(saved)
  }, [setProjectName])

  const handlePublish = useCallback(async () => {
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: generatedFiles })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Falha na publicação')
      const url = `/p/${data.slug}`
      window.open(url, '_blank')
    } catch (err: any) {
      alert(err.message || 'Erro ao publicar')
    }
  }, [generatedFiles])

  const onRename = () => {
    const next = window.prompt('Renomear projeto', projectName)
    if (next && next.trim()) setProjectName(next.trim())
  }

  const onDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir este projeto? Essa ação não pode ser desfeita.')) {
      resetProject()
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr]">
      <header className="flex h-12 items-center justify-between border-b bg-background px-3">
        <div className="flex items-center gap-3">
          <QuickNav />
          <span className="hidden text-sm font-medium sm:block">{projectName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePublish} disabled={generatedFiles.length === 0}>Publicar</Button>
          <Button variant="outline" size="sm" onClick={() => saveCurrentSnapshot()}>Salvar versão</Button>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Configurações" title="Configurações">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent sideOffset={6} className="w-48">
              <DropdownMenuItem onClick={onRename}>Renomear projeto</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>Excluir projeto…</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="min-h-0 custom-scrollbar overflow-y-auto">{children}</main>
    </div>
  )
} 