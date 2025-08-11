'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { CodeIcon, EyeOpenIcon, FileIcon } from '@radix-ui/react-icons'
import { FolderIcon } from 'lucide-react'
import { GeneratedFile } from '@/lib/ai'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTheme } from '@/components/theme/theme-provider'
import { useProjectStore } from '@/store/project-store'
import type { DiffOperation } from '@/lib/vfs'

interface FileNode {
  name: string
  content?: string
  type?: string
  children?: { [key: string]: FileNode }
}

interface CodeViewerProps {
  files: GeneratedFile[]
}

const getLanguage = (path: string): string => {
    const extension = path.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'js':
        case 'jsx':
            return 'javascript';
        case 'ts':
        case 'tsx':
            return 'typescript';
        case 'css':
            return 'css';
        case 'html':
            return 'html';
        case 'json':
            return 'json';
        case 'md':
            return 'markdown';
        default:
            return 'plaintext';
    }
}

function computeChangedLineSets(before: string, after: string): { beforeChanged: Set<number>, afterChanged: Set<number> } {
  const beforeLines = before.split(/\r?\n/)
  const afterLines = after.split(/\r?\n/)
  const maxLen = Math.max(beforeLines.length, afterLines.length)
  const beforeChanged = new Set<number>()
  const afterChanged = new Set<number>()
  for (let i = 0; i < maxLen; i++) {
    const a = beforeLines[i]
    const b = afterLines[i]
    if (a !== b) {
      if (i < beforeLines.length) beforeChanged.add(i + 1) // line numbers start at 1
      if (i < afterLines.length) afterChanged.add(i + 1)
    }
  }
  return { beforeChanged, afterChanged }
}

export function CodeViewer({ files }: CodeViewerProps) {
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null)
  const { theme } = useTheme()
  const { setActiveView, applyVfsDiff, previewDiffOnce, revertLastChange } = useProjectStore()
  const [isDiffMode, setIsDiffMode] = useState(false)
  const [diffJson, setDiffJson] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [previewFiles, setPreviewFiles] = useState<GeneratedFile[] | null>(null)
  const [previewChanged, setPreviewChanged] = useState<string[]>([])
  const [parsedOps, setParsedOps] = useState<DiffOperation[] | null>(null)
  const [selectedOpsIdx, setSelectedOpsIdx] = useState<Set<number>>(new Set())
  const [selectedPreviewPath, setSelectedPreviewPath] = useState<string | null>(null)

  // Organiza os arquivos em uma estrutura de árvore
  const buildFileTree = (files: GeneratedFile[]): { [key: string]: FileNode } => {
    const root: { [key: string]: FileNode } = {}

    files.forEach((file) => {
      const parts = file.path.split('/')
      let current = root

      parts.forEach((part, i) => {
        if (i === parts.length - 1) {
          // Arquivo
          current[part] = {
            name: part,
            content: file.content,
            type: file.type,
          }
        } else {
          // Diretório
          if (!current[part]) {
            current[part] = {
              name: part,
              children: {},
            }
          }
          current = (current[part].children || {}) as { [key: string]: FileNode }
        }
      })
    })

    return root
  }

  const fileStructure = buildFileTree(files)

  const renderFileTree = (nodes: { [key: string]: FileNode }, pathPrefix = '', level = 0) => {
    return Object.entries(nodes).map(([key, node]) => {
      const nodePath = pathPrefix ? `${pathPrefix}/${node.name}` : node.name

      return (
        <div key={nodePath} style={{ marginLeft: `${level * 1.5}rem` }}>
          <button
            onClick={() => {
              if (node.content) {
                const fileToSelect = files.find(f => f.path === nodePath)
                setSelectedFile(fileToSelect || null)
              }
            }}
            className={`flex w-full items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-accent ${
              selectedFile?.path === nodePath ? 'bg-accent' : ''
            }`}
          >
            {node.children ? (
              <FolderIcon className="h-4 w-4" />
            ) : (
              <FileIcon className="h-4 w-4" />
            )}
            {node.name}
            {node.type && (
              <span className="ml-auto text-xs text-muted-foreground">
                {node.type}
              </span>
            )}
          </button>
          {node.children && renderFileTree(node.children, nodePath, level + 1)}
        </div>
      )
    })
  }

  const currentFilesMap = new Map(files.map(f => [f.path, f]))
  const previewFilesMap = new Map((previewFiles || []).map(f => [f.path, f]))

  const beforeContent = selectedPreviewPath ? (currentFilesMap.get(selectedPreviewPath)?.content || '') : ''
  const afterContent = selectedPreviewPath ? (previewFilesMap.get(selectedPreviewPath)?.content || '') : ''

  const { beforeChanged, afterChanged } = useMemo(() => computeChangedLineSets(beforeContent, afterContent), [beforeContent, afterContent])

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b px-2 py-2">
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" aria-label="Pré-visualizar" title="Pré-visualizar" onClick={() => setActiveView('preview')}>
            <EyeOpenIcon className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="default" aria-label="Código" title="Código">
            <CodeIcon className="h-5 w-5" />
          </Button>
        </div>
        <div className="mx-auto text-xs text-muted-foreground">{isDiffMode ? 'Modo Diff' : 'Visualizando código'}</div>
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant={isDiffMode ? 'secondary' : 'outline'} onClick={() => setIsDiffMode((v) => !v)}>
            {isDiffMode ? 'Fechar Diff' : 'Abrir Diff'}
          </Button>
        </div>
      </div>
      <div className="flex h-full divide-x">
        <div className="w-64 overflow-y-auto p-4">
          <div className="font-medium">Arquivos do Projeto</div>
          <div className="mt-4 space-y-1">{renderFileTree(fileStructure)}</div>
        </div>
        <div className="flex-1 overflow-y-auto bg-muted/30">
          {isDiffMode ? (
            <div className="flex h-full flex-col gap-3 p-3">
              <div className="text-sm text-muted-foreground">Cole um array JSON de operações de diff (kind/create|write|replace|delete|rename). Selecione quais aplicar e visualize as mudanças por arquivo.</div>
              <textarea
                className="min-h-[140px] rounded border bg-background p-2 font-mono text-sm"
                value={diffJson}
                onChange={(e) => {
                  setDiffJson(e.target.value)
                  setError(null)
                  try {
                    const ops = JSON.parse(e.target.value) as DiffOperation[]
                    if (!Array.isArray(ops)) throw new Error('JSON não é um array')
                    setParsedOps(ops)
                    // Seleciona todas por padrão
                    setSelectedOpsIdx(new Set(ops.map((_, i) => i)))
                  } catch {
                    setParsedOps(null)
                    setSelectedOpsIdx(new Set())
                  }
                }}
                placeholder='[
  { "kind": "write", "path": "index.html", "content": "<html>...</html>" }
]'
              />
              {error && <div className="text-sm text-red-600">{error}</div>}

              {parsedOps && (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                  <div className="rounded border bg-background p-2">
                    <div className="mb-2 text-xs font-medium text-muted-foreground">Operações</div>
                    <div className="space-y-1">
                      {parsedOps.map((op, idx) => (
                        <label key={idx} className="flex items-start gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={selectedOpsIdx.has(idx)}
                            onChange={(e) => {
                              const next = new Set(selectedOpsIdx)
                              if (e.target.checked) next.add(idx)
                              else next.delete(idx)
                              setSelectedOpsIdx(next)
                            }}
                          />
                          <span>
                            <span className="font-medium">{op.kind}</span>
                            {op.kind === 'create' && ` → ${op.file.path}`}
                            {op.kind === 'write' && ` → ${op.path}`}
                            {op.kind === 'replace' && ` → ${op.path}`}
                            {op.kind === 'delete' && ` → ${op.path}`}
                            {op.kind === 'rename' && ` → ${op.from} → ${op.to}`}
                          </span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          try {
                            const ops = parsedOps.filter((_, i) => selectedOpsIdx.has(i))
                            if (ops.length === 0) throw new Error('Selecione ao menos uma operação')
                            const prev = await previewDiffOnce(ops)
                            setPreviewFiles(prev.files)
                            setPreviewChanged(prev.changedFiles)
                            setSelectedPreviewPath(prev.changedFiles[0] || null)
                          } catch (e: any) {
                            setError(e?.message || 'Falha na pré-visualização')
                          }
                        }}
                      >
                        Atualizar Pré-visualização
                      </Button>
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            const ops = parsedOps.filter((_, i) => selectedOpsIdx.has(i))
                            if (ops.length === 0) throw new Error('Selecione ao menos uma operação')
                            await applyVfsDiff(ops)
                          } catch (e: any) {
                            setError(e?.message || 'Falha ao aplicar diffs')
                          }
                        }}
                      >
                        Aplicar Selecionadas
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => revertLastChange()}>Reverter</Button>
                    </div>
                  </div>

                  <div className="rounded border bg-background p-2">
                    <div className="mb-2 text-xs font-medium text-muted-foreground">Arquivos afetados</div>
                    {previewChanged.length === 0 ? (
                      <div className="text-xs text-muted-foreground">Nenhuma mudança pré-visualizada</div>
                    ) : (
                      <ul className="space-y-1 text-xs">
                        {previewChanged.map((p) => (
                          <li key={p}>
                            <button className={`w-full rounded px-2 py-1 text-left hover:bg-accent ${selectedPreviewPath === p ? 'bg-accent' : ''}`} onClick={() => setSelectedPreviewPath(p)}>
                              {p}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="rounded border bg-background p-2">
                    <div className="mb-2 text-xs font-medium text-muted-foreground">Pré-visualização (Antes vs Depois)</div>
                    {selectedPreviewPath ? (
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <div className="rounded border bg-muted/20">
                          <div className="border-b p-1 text-[11px] text-muted-foreground">Antes — {selectedPreviewPath}</div>
                          <SyntaxHighlighter
                            language={getLanguage(selectedPreviewPath)}
                            style={theme === 'dark' ? vscDarkPlus : vs}
                            showLineNumbers
                            wrapLines
                            lineProps={(lineNumber) => beforeChanged.has(lineNumber) ? { style: { backgroundColor: 'rgba(244,63,94,0.18)' } } : {}}
                            customStyle={{ margin: 0, padding: '0.75rem', backgroundColor: 'transparent' }}
                          >
                            {beforeContent}
                          </SyntaxHighlighter>
                        </div>
                        <div className="rounded border bg-muted/20">
                          <div className="border-b p-1 text-[11px] text-muted-foreground">Depois — {selectedPreviewPath}</div>
                          <SyntaxHighlighter
                            language={getLanguage(selectedPreviewPath)}
                            style={theme === 'dark' ? vscDarkPlus : vs}
                            showLineNumbers
                            wrapLines
                            lineProps={(lineNumber) => afterChanged.has(lineNumber) ? { style: { backgroundColor: 'rgba(34,197,94,0.18)' } } : {}}
                            customStyle={{ margin: 0, padding: '0.75rem', backgroundColor: 'transparent' }}
                          >
                            {afterContent}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">Selecione um arquivo afetado para visualizar</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : selectedFile ? (
            <SyntaxHighlighter
              language={getLanguage(selectedFile.path)}
              style={theme === 'dark' ? vscDarkPlus : vs}
              showLineNumbers
              wrapLines={true}
              customStyle={{
                  width: '100%',
                  height: '100%',
                  margin: 0,
                  padding: '1rem',
                  backgroundColor: 'transparent',
              }}
              codeTagProps={{
                  style: {
                      fontSize: '0.9rem',
                      fontFamily: 'var(--font-mono, monospace)',
                  }
              }}
            >
              {selectedFile.content}
            </SyntaxHighlighter>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Selecione um arquivo para visualizar o código
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 