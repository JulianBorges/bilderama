"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { PanelLeftOpen, PanelLeftClose } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/theme-toggle'

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('bilderama:sidebar-collapsed')
    if (saved) setCollapsed(saved === '1')
  }, [])

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('bilderama:sidebar-collapsed', next ? '1' : '0')
  }

  return (
    <div className={`min-h-screen grid grid-rows-[auto_1fr] grid-cols-1 lg:grid-cols-[auto_1fr]`}>
      <aside className={`hidden lg:flex flex-col border-r bg-muted/20 transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[240px]'}`}>
        <div className="h-14 flex items-center justify-between px-3 border-b">
          <div className={`text-xl font-bold truncate transition-opacity duration-200 ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>Bilderama</div>
          <Button size="icon" variant="ghost" onClick={toggle} aria-label="Alternar sidebar" className="shrink-0">
            {collapsed ? <PanelLeftOpen className="h-4 w-4"/> : <PanelLeftClose className="h-4 w-4"/>}
          </Button>
        </div>
        <nav className="p-2 space-y-1">
          {['Editor','Projetos','Publicações'].map((item) => (
            <div key={item} className={`rounded-md px-2 py-2 text-sm hover:bg-muted cursor-default transition-colors ${collapsed ? 'text-center' : ''}`}>{collapsed ? item[0] : item}</div>
          ))}
        </nav>
      </aside>

      <div className="col-span-1 grid grid-rows-[auto_1fr] min-h-0">
        <header className="flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 h-14">
          <div className="flex items-center gap-2 lg:hidden">
            <Button size="icon" variant="ghost" onClick={toggle} aria-label="Abrir sidebar">
              {collapsed ? <PanelLeftOpen className="h-4 w-4"/> : <PanelLeftClose className="h-4 w-4"/>}
            </Button>
            <div className="text-lg font-bold">Bilderama</div>
          </div>
          <div className="text-sm text-muted-foreground hidden lg:block">Copiloto web com IA — MVP</div>
          <ThemeToggle />
        </header>
        <main className="min-h-0 custom-scrollbar overflow-y-auto">{children}</main>
      </div>
    </div>
  )
} 