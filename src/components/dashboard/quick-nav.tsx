"use client"

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

export function QuickNav() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) { setOpen(false) }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const handleNewProject = () => {
    window.location.reload()
  }

  return (
    <div ref={containerRef} className="relative flex items-center gap-1">
      <button
        className="rounded-md px-2 py-1 text-lg font-semibold hover:bg-accent"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        Bilderama
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-md border bg-popover p-2 shadow-md">
          <div className="px-2 py-1 text-xs uppercase text-muted-foreground">Ações</div>
          <button onClick={handleNewProject} className="w-full rounded-md bg-primary/10 px-3 py-2 text-left text-sm text-primary hover:bg-primary/20">+ Novo Projeto</button>
          <button className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent">Pesquisar…</button>
          <div className="my-2 h-px bg-muted" />
          <div className="px-2 py-1 text-xs uppercase text-muted-foreground">Recentes</div>
          <div className="px-2 py-2 text-sm text-muted-foreground">(Em breve) Listagem de projetos recentes</div>
        </div>
      )}
    </div>
  )
} 