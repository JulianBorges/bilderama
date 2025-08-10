'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { DesktopIcon, MobileIcon, EyeOpenIcon, CodeIcon } from '@radix-ui/react-icons'
import { GeneratedFile } from '@/lib/ai'
import { useProjectStore } from '@/store/project-store'

interface PreviewIframeProps {
  files: GeneratedFile[]
  isLoading: boolean
  onElementSelect: (element: { id: string; tagName: string; innerText: string; blockIndex?: string; propKey?: string }) => void;
  isEditMode: boolean;
  currentPath?: string;
  onPathChange?: (path: string) => void;
}

export function PreviewIframe({ files, isLoading, onElementSelect, isEditMode, currentPath: externalPath, onPathChange }: PreviewIframeProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [internalPath, setInternalPath] = useState<string>('/')
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { activeView, setActiveView, saveCurrentSnapshot } = useProjectStore()

  const currentPath = externalPath ?? internalPath

  const htmlFiles = files.filter(f => f.path.endsWith('.html'))
  const cssFiles = files.filter(f => f.path.endsWith('.css'))
  const jsFiles = files.filter(f => f.path.endsWith('.js'))

  const availableRoutes = useMemo(() => {
    return htmlFiles.map(f => (f.path === 'index.html' ? '/' : `/${f.path.replace(/\.html$/, '')}`))
  }, [htmlFiles])

  useEffect(() => {
    if (!availableRoutes.includes(currentPath) && availableRoutes.length > 0) {
      const next = availableRoutes[0]
      if (onPathChange) onPathChange(next)
      else setInternalPath(next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableRoutes.join('|')])

  const findHtmlFile = (path: string) => {
    const normalizedPath = path === '/' ? 'index.html' : `${path.slice(1)}.html`
    return htmlFiles.find(f => f.path === normalizedPath) || htmlFiles[0]
  }

  const generateFullHtml = (path: string, editMode: boolean) => {
    const htmlFile = findHtmlFile(path)
    let dataThemeAttr = 'moderno_azul'
    const themeMatch = htmlFile?.content.match(/data-theme="([^"]+)"/)
    if (themeMatch && themeMatch[1]) { dataThemeAttr = themeMatch[1] }
    if (!htmlFile) return ''
    const cssMatch = htmlFile.content.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    const extractedCss = cssMatch ? cssMatch.join('\n') : '';
    let processedHtmlContent = htmlFile.content;
    processedHtmlContent = processedHtmlContent.replace(/<link\s+[^>]*?href\s*=\s*["']{1}[^"']*tailwindcss[^"']*["']{1}[^>]*?>/gi, '');
    processedHtmlContent = processedHtmlContent.replace(/<link\s+[^>]*?href\s*=\s*(["'])(?!http)([^\s>"']+?\.css)\1[^>]*?>/gi, '');
    processedHtmlContent = processedHtmlContent.replace(/<script\s+[^>]*?src\s*=\s*(["'])(?!http)([^\s>"']+?\.js)\1[^>]*?>\s*<\/script>/gi, '');

    const jsContent = `
      const IS_EDIT_MODE = ${editMode};
      let selectedElement = null;
      let hoveredElement = null;
      const selectOutlineStyle = '2px solid #6366F1';
      const hoverOutlineStyle = '2px dashed #A5B4FC';
      document.addEventListener('mouseover', (e) => {
        if (!IS_EDIT_MODE) return;
        if (e.target === document.body || e.target === hoveredElement) return;
        hoveredElement = e.target;
        if (hoveredElement !== selectedElement) {
          hoveredElement.style.outline = hoverOutlineStyle;
          hoveredElement.style.outlineOffset = '-2px';
        }
      });
      document.addEventListener('mouseout', (e) => {
        if (!IS_EDIT_MODE || !hoveredElement) return;
        if (hoveredElement !== selectedElement) {
          hoveredElement.style.outline = 'none';
        }
        hoveredElement = null;
      });
      document.addEventListener('click', (e) => {
        if (IS_EDIT_MODE) {
          e.preventDefault(); e.stopPropagation();
          if (selectedElement) { selectedElement.style.outline = 'none'; }
          if (!e.target.dataset.bildId) { e.target.dataset.bildId = 'bild-' + Math.random().toString(36).substr(2, 9); }
          selectedElement = e.target;
          selectedElement.style.outline = selectOutlineStyle;
          selectedElement.style.outlineOffset = '-2px';
          window.parent.postMessage({ type: 'element-select', elementId: selectedElement.dataset.bildId, tagName: selectedElement.tagName, innerText: selectedElement.innerText, blockIndex: selectedElement.getAttribute('data-bild-block-index'), propKey: selectedElement.getAttribute('data-bild-prop') }, '*');
        } else {
          const link = e.target.closest('a');
          if (link && link.href) { e.preventDefault(); const url = new URL(link.href); window.parent.postMessage({ type: 'navigation', path: url.pathname }, '*'); }
        }
      }, true);
      document.addEventListener('submit', (e) => { e.preventDefault(); const formData = new FormData(e.target); const data = Object.fromEntries(formData); window.parent.postMessage({ type: 'form', data }, '*') });
      ${jsFiles.map(f => f.content).join('\n')}
    `

    return `
      <!DOCTYPE html>
      <html data-theme="${dataThemeAttr}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${extractedCss}
          <style>
            html, body { margin: 0; padding: 0; height: 100%; min-height: 100vh; }
            ${cssFiles.map(f => f.content).join('\n')}
          </style>
        </head>
        <body>
          ${processedHtmlContent}
          <script>${jsContent}</script>
        </body>
      </html>
    `
  }

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'navigation') {
        const next = event.data.path
        if (onPathChange) onPathChange(next)
        else setInternalPath(next)
        setSelectedElement(null)
      } else if (event.data.type === 'form') { console.log('Dados do formulário:', event.data.data) }
      else if (event.data.type === 'element-select') {
        onElementSelect({ id: event.data.elementId, tagName: event.data.tagName, innerText: event.data.innerText, blockIndex: event.data.blockIndex, propKey: event.data.propKey });
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onElementSelect, onPathChange])

  useEffect(() => {
    if (iframeRef.current) { iframeRef.current.srcdoc = generateFullHtml(currentPath, isEditMode) }
  }, [currentPath, files, isEditMode])

  const handlePathChange = (path: string) => {
    if (onPathChange) onPathChange(path)
    else setInternalPath(path)
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b px-2 py-2">
        {/* Esquerda: Preview/Código somente ícones */}
        <div className="flex items-center gap-1">
          <Button variant={activeView === 'preview' ? 'default' : 'ghost'} size="icon" aria-label="Pré-visualizar" title="Pré-visualizar" onClick={() => setActiveView('preview')}>
            <EyeOpenIcon className="h-5 w-5" />
          </Button>
          <Button variant={activeView === 'code' ? 'default' : 'ghost'} size="icon" aria-label="Código" title="Código" onClick={() => setActiveView('code')}>
            <CodeIcon className="h-5 w-5" />
          </Button>
        </div>
        {/* Centro: seletor de páginas */}
        <div className="mx-auto w-full max-w-xs">
          <select
            value={currentPath}
            onChange={(e) => handlePathChange(e.target.value)}
            className="w-full appearance-none rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none"
          >
            {availableRoutes.map((route) => (
              <option key={route} value={route}>{route}</option>
            ))}
          </select>
        </div>
        {/* Direita: device icons + salvar versão */}
        <div className="ml-auto flex items-center gap-1">
          <Button variant={viewMode === 'desktop' ? 'default' : 'ghost'} size="icon" aria-label="Desktop" title="Desktop" onClick={() => setViewMode('desktop')}>
            <DesktopIcon className="h-5 w-5" />
          </Button>
          <Button variant={viewMode === 'mobile' ? 'default' : 'ghost'} size="icon" aria-label="Mobile" title="Mobile" onClick={() => setViewMode('mobile')}>
            <MobileIcon className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="sm" className="ml-2" title="Salvar versão" onClick={() => saveCurrentSnapshot()}>Salvar versão</Button>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center bg-muted/30">
        <div className={`relative h-[calc(94vh-8rem)] ${viewMode === 'mobile' ? 'w-[375px]' : 'w-full'} overflow-hidden rounded-lg border bg-white shadow-sm transition-all duration-200`}>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <iframe ref={iframeRef} srcDoc={generateFullHtml(currentPath, isEditMode)} className="h-full w-full" sandbox="allow-scripts allow-same-origin allow-forms" title="Preview" loading="lazy" />
          )}
        </div>
      </div>
    </div>
  )
} 