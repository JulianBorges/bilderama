'use client'

import { useState, useEffect } from 'react'
import { Clock, Star, Trash2, RotateCcw, XCircle } from 'lucide-react'
import { useProjectStore } from '@/store/project-store'

export type SnapshotChatMessage = {
  role: 'user' | 'assistant'
  content: string
  type?: 'prompt' | 'explanation' | 'suggestions' | 'files' | 'error'
}

type ProjectSnapshot = {
  id: string
  title: string
  prompt: string
  pagePlanJson: string
  chat?: SnapshotChatMessage[]
  createdAt: string
  isFavorite: boolean
}

export function ProjectHistory() {
  const [snapshots, setSnapshots] = useState<ProjectSnapshot[]>([])
  const [diffTarget, setDiffTarget] = useState<ProjectSnapshot | null>(null)
  const { setGeneratedFiles, setIsGenerating, setSelectedElement, setActiveView, pagePlan, setChatMessages, saveCurrentSnapshotServer } = useProjectStore()

  useEffect(() => {
    const saved = localStorage.getItem('bilderama:versions')
    if (saved) {
      setSnapshots(JSON.parse(saved))
    }
  }, [])

  const syncFromServer = async () => {
    try {
      const res = await fetch('/api/projects?id=default', { method: 'GET' })
      const data = await res.json()
      const serverSnaps = (data?.project?.snapshots || []) as ProjectSnapshot[]
      if (Array.isArray(serverSnaps) && serverSnaps.length > 0) {
        setSnapshots(serverSnaps)
        persist(serverSnaps)
      }
    } catch (_) {
      // silencioso
    }
  }

  const persist = (list: ProjectSnapshot[]) => {
    localStorage.setItem('bilderama:versions', JSON.stringify(list))
  }

  const toggleFavorite = (id: string) => {
    const updated = snapshots.map((s) => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s)
    setSnapshots(updated)
    persist(updated)
  }

  const deleteSnapshot = (id: string) => {
    const updated = snapshots.filter((s) => s.id !== id)
    setSnapshots(updated)
    persist(updated)
  }

  const restoreSnapshot = async (snap: ProjectSnapshot) => {
    try {
      setIsGenerating(true)
      setSelectedElement(null)
      setActiveView('preview')

      // Restaura chat salvo (store + localStorage) se existir
      if (snap.chat && Array.isArray(snap.chat)) {
        setChatMessages(snap.chat)
        localStorage.setItem('bilderama:chat', JSON.stringify(snap.chat))
      }

      const response = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: snap.pagePlanJson,
      })
      if (!response.ok) throw new Error('Falha ao restaurar a versão')
      const { files } = await response.json()
      setGeneratedFiles(files)
    } finally {
      setIsGenerating(false)
      setDiffTarget(null)
    }
  }

  const openDiff = (snap: ProjectSnapshot) => {
    setDiffTarget(snap)
  }

  const closeDiff = () => setDiffTarget(null)

  const pretty = (json: string) => {
    try { return JSON.stringify(JSON.parse(json), null, 2) } catch { return json }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Histórico de versões</h2>
        <div className="flex gap-2">
          <button
            onClick={() => saveCurrentSnapshotServer()}
            className="rounded-md border bg-primary px-3 py-1.5 text-sm text-primary-foreground"
            title="Salvar versão atual no servidor"
          >Salvar no servidor</button>
          <button
            onClick={syncFromServer}
            className="rounded-md border px-3 py-1.5 text-sm"
            title="Sincronizar do servidor"
          >Sincronizar</button>
        </div>
      </div>
      {snapshots.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma versão salva ainda. Gere um projeto para criar snapshots automáticos.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {snapshots.map((snap) => (
            <div key={snap.id} className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold line-clamp-1" title={snap.title}>{snap.title}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleFavorite(snap.id)}
                    className={`rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800 ${snap.isFavorite ? 'text-yellow-500' : ''}`}
                    title={snap.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    <Star className="h-4 w-4" fill={snap.isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => openDiff(snap)}
                    className="rounded-lg p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                    title="Ver diferenças"
                  >
                    Diff
                  </button>
                  <button
                    onClick={() => restoreSnapshot(snap)}
                    className="rounded-lg p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                    title="Restaurar esta versão"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteSnapshot(snap.id)}
                    className="rounded-lg p-1 text-destructive hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Excluir versão"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{snap.prompt}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{new Date(snap.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {diffTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeDiff} />
          <div className="relative z-10 w-[95vw] max-w-6xl rounded-lg border bg-background p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Diferenças (Atual vs Selecionada)</h3>
              <button onClick={closeDiff} className="rounded p-1 hover:bg-accent" aria-label="Fechar diff"><XCircle className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <div className="mb-1 text-xs text-muted-foreground">Atual</div>
                <pre className="overflow-auto rounded border bg-muted/30 p-3 text-xs">{pagePlan ? JSON.stringify(pagePlan, null, 2) : 'Sem versão atual'}</pre>
              </div>
              <div>
                <div className="mb-1 text-xs text-muted-foreground">Selecionada</div>
                <pre className="overflow-auto rounded border bg-muted/30 p-3 text-xs">{pretty(diffTarget.pagePlanJson)}</pre>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">Chat salvo: {diffTarget.chat ? `${diffTarget.chat.length} mensagens` : 'sem histórico'}</div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => restoreSnapshot(diffTarget)} className="rounded-md border bg-primary px-3 py-1.5 text-sm text-primary-foreground">Restaurar esta versão</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 