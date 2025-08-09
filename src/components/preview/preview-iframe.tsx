'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { DesktopIcon, MobileIcon } from '@radix-ui/react-icons'
import { GeneratedFile } from '@/lib/ai'

interface PreviewIframeProps {
  files: GeneratedFile[]
  isLoading: boolean
  onElementSelect: (element: { id: string; tagName: string; innerText: string; blockIndex?: string; propKey?: string }) => void;
  isEditMode: boolean;
}

export function PreviewIframe({ files, isLoading, onElementSelect, isEditMode }: PreviewIframeProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [currentPath, setCurrentPath] = useState<string>('/')
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const htmlFiles = files.filter(f => f.path.endsWith('.html'))
  const cssFiles = files.filter(f => f.path.endsWith('.css'))
  const jsFiles = files.filter(f => f.path.endsWith('.js'))

  const availableRoutes = useMemo(() => {
    return htmlFiles.map(f => (f.path === 'index.html' ? '/' : `/${f.path.replace(/\.html$/, '')}`))
  }, [htmlFiles])

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
    processedHtmlContent = processedHtmlContent.replace(/<link\s+[^>]*?href\s*=\s*["]{1}[^"']*tailwindcss[^"']*["]{1}[^>]*?>/gi, '');
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
      if (event.data.type === 'navigation') { setCurrentPath(event.data.path); setSelectedElement(null) }
      else if (event.data.type === 'form') { console.log('Dados do formulário:', event.data.data) }
      else if (event.data.type === 'element-select') {
        onElementSelect({ id: event.data.elementId, tagName: event.data.tagName, innerText: event.data.innerText, blockIndex: event.data.blockIndex, propKey: event.data.propKey });
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onElementSelect])

  useEffect(() => {
    if (iframeRef.current) { iframeRef.current.srcdoc = generateFullHtml(currentPath, isEditMode) }
  }, [currentPath, files, isEditMode])

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-b p-2">
        <div className="flex items-center gap-2">
          <Button variant={viewMode === 'desktop' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('desktop')}>
            <DesktopIcon className="mr-2 h-4 w-4" /> Desktop
          </Button>
          <Button variant={viewMode === 'mobile' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('mobile')}>
            <MobileIcon className="mr-2 h-4 w-4" /> Mobile
          </Button>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {availableRoutes.map((route) => (
            <button key={route} onClick={() => setCurrentPath(route)} className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${currentPath === route ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted hover:bg-muted/70 border-border'}`}>
              {route}
            </button>
          ))}
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