'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CodeIcon, EyeOpenIcon, FileIcon } from '@radix-ui/react-icons'
import { FolderIcon } from 'lucide-react'
import { GeneratedFile } from '@/lib/ai'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTheme } from '@/components/theme/theme-provider'
import { useProjectStore } from '@/store/project-store'

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

export function CodeViewer({ files }: CodeViewerProps) {
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null)
  const { theme } = useTheme()
  const { setActiveView } = useProjectStore()

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
        <div className="mx-auto text-xs text-muted-foreground">Visualizando código</div>
        <div />
      </div>
      <div className="flex h-full divide-x">
        <div className="w-64 overflow-y-auto p-4">
          <div className="font-medium">Arquivos do Projeto</div>
          <div className="mt-4 space-y-1">{renderFileTree(fileStructure)}</div>
        </div>
        <div className="flex-1 overflow-y-auto bg-muted/30">
          {selectedFile ? (
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