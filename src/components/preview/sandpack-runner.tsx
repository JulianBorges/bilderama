'use client'

import { SandpackProvider, SandpackLayout, SandpackPreview } from '@codesandbox/sandpack-react'
import type { GeneratedFile } from '@/lib/ai'

function toSandpackFiles(files: GeneratedFile[]): Record<string, { code: string }> {
  const map: Record<string, { code: string }> = {}

  // Index.html obrigatório
  const index = files.find(f => f.path === 'index.html') || files.find(f => f.path.endsWith('.html'))
  if (index) map['/index.html'] = { code: index.content }
  else map['/index.html'] = { code: '<!doctype html><html><head><meta charset="utf-8"/></head><body><h1>Bilderama</h1></body></html>' }

  // Demais arquivos
  for (const f of files) {
    const p = f.path.startsWith('/') ? f.path : `/${f.path}`
    // Evita sobrescrever index se já mapeado
    if (p === '/index.html') continue
    map[p] = { code: f.content }
  }

  return map
}

interface RunnerProps { files: GeneratedFile[] }

export function SandpackRunner({ files }: RunnerProps) {
  const spFiles = toSandpackFiles(files)
  return (
    <SandpackProvider template="vanilla" files={spFiles} options={{ activeFile: '/index.html' }}>
      <SandpackLayout>
        <div style={{ width: '100%', height: '100%', minHeight: 300 }}>
          <SandpackPreview showOpenInCodeSandbox={false} showRefreshButton />
        </div>
      </SandpackLayout>
    </SandpackProvider>
  )
} 