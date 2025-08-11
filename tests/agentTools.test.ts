import { describe, it, expect } from 'vitest'
import { AgentVfsSession } from '../src/lib/services/agentTools'
import type { GeneratedFile } from '../src/lib/ai'

describe('AgentVfsSession', () => {
  const initial: GeneratedFile[] = [
    { path: 'index.html', content: '<h1>Ola</h1>', type: 'page', description: 'home' },
    { path: 'app.css', content: 'h1{color:red}', type: 'style', description: 'styles' },
  ]

  it('inicializa e lista arquivos', () => {
    const session = new AgentVfsSession(initial)
    const list = session.list()
    expect(list.map(x => x.path).sort()).toEqual(['app.css', 'index.html'])
  })

  it('aplica diffs e mantém snapshot coerente', () => {
    const session = new AgentVfsSession(initial)
    const res = session.applyDiff([
      { kind: 'write', path: 'index.html', content: '<h1>Olá Mundo</h1>' },
      { kind: 'create', file: { path: 'readme.md', content: '# Readme', type: 'config' } },
    ])
    expect(res.ok).toBe(true)
    const snap = session.snapshot()
    expect(snap.find(f => f.path === 'readme.md')).toBeTruthy()
    expect(snap.find(f => f.path === 'index.html')?.content).toContain('Olá Mundo')
  })
}) 