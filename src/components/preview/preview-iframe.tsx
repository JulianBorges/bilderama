'use client'

import { useState, useRef, useEffect } from 'react'
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

  // Encontra o arquivo HTML principal e os arquivos CSS/JS
  const htmlFiles = files.filter(f => f.path.endsWith('.html'))
  const cssFiles = files.filter(f => f.path.endsWith('.css'))
  const jsFiles = files.filter(f => f.path.endsWith('.js'))

  // Função para encontrar o arquivo HTML correspondente ao caminho atual
  const findHtmlFile = (path: string) => {
    const normalizedPath = path === '/' ? 'index.html' : `${path.slice(1)}.html`
    return htmlFiles.find(f => f.path === normalizedPath) || htmlFiles[0]
  }

  // Gera o HTML completo com todos os recursos
  const generateFullHtml = (path: string, editMode: boolean) => {
    const htmlFile = findHtmlFile(path)
    if (!htmlFile) return ''

    // Limpar o conteúdo HTML de links para CSS e JS locais
    let processedHtmlContent = htmlFile.content;
    // Remove qualquer link para o CDN do Tailwind, para evitar conflitos
    processedHtmlContent = processedHtmlContent.replace(/<link\s+[^>]*?href\s*=\s*["'][^"']*tailwindcss[^"']*["'][^>]*?>/gi, '');
    // Remove <link rel="stylesheet" href="styles.css" /> ou similares (case-insensitive, pode ter outros atributos)
    processedHtmlContent = processedHtmlContent.replace(/<link\s+[^>]*?href\s*=\s*(["'])(?!http)([^\s>"']+?\.css)\1[^>]*?>/gi, '');
    // Remove <script src="script.js"></script> ou similares (case-insensitive, pode ter outros atributos)
    processedHtmlContent = processedHtmlContent.replace(/<script\s+[^>]*?src\s*=\s*(["'])(?!http)([^\s>"']+?\.js)\1[^>]*?>\s*<\/script>/gi, '');

    const cssContent = cssFiles.map(f => f.content).join('\n')
    const jsContent = `
      const IS_EDIT_MODE = ${editMode};
      let selectedElement = null;
      let hoveredElement = null;

      const selectOutlineStyle = '2px solid #6366F1'; // Estilo do outline de seleção
      const hoverOutlineStyle = '2px dashed #A5B4FC'; // Estilo do outline de hover

      document.addEventListener('mouseover', (e) => {
        if (!IS_EDIT_MODE) return;
        if (e.target === document.body || e.target === hoveredElement) return;

        hoveredElement = e.target;
        // Não aplica hover se já for o elemento selecionado
        if (hoveredElement !== selectedElement) {
          hoveredElement.style.outline = hoverOutlineStyle;
          hoveredElement.style.outlineOffset = '-2px';
        }
      });

      document.addEventListener('mouseout', (e) => {
        if (!IS_EDIT_MODE || !hoveredElement) return;
        // Remove o outline de hover apenas se não for o elemento selecionado
        if (hoveredElement !== selectedElement) {
            hoveredElement.style.outline = 'none';
        }
        hoveredElement = null;
      });

      // Intercepta cliques
      document.addEventListener('click', (e) => {
        if (IS_EDIT_MODE) {
            // Lógica do Modo de Edição
            e.preventDefault();
            e.stopPropagation();

            if (selectedElement) {
                selectedElement.style.outline = 'none';
            }
            
            if (!e.target.dataset.bildId) {
                e.target.dataset.bildId = 'bild-' + Math.random().toString(36).substr(2, 9);
            }
            
            selectedElement = e.target;
            selectedElement.style.outline = selectOutlineStyle;
            selectedElement.style.outlineOffset = '-2px';

            window.parent.postMessage({
                type: 'element-select',
                elementId: selectedElement.dataset.bildId,
                tagName: selectedElement.tagName,
                innerText: selectedElement.innerText,
                blockIndex: selectedElement.getAttribute('data-bild-block-index'),
                propKey: selectedElement.getAttribute('data-bild-prop')
            }, '*');

        } else {
            // Lógica do Modo de Navegação
            const link = e.target.closest('a');
            if (link && link.href) {
                e.preventDefault();
                const url = new URL(link.href);
                window.parent.postMessage({ type: 'navigation', path: url.pathname }, '*');
            }
        }
      }, true);

      // Intercepta envios de formulário
      document.addEventListener('submit', (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const data = Object.fromEntries(formData)
        window.parent.postMessage({ type: 'form', data }, '*')
      });

      ${jsFiles.map(f => f.content).join('\n')}
    `

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            /* Reset básico e garantia de altura total */
            html, body {
              margin: 0;
              padding: 0;
              height: 100%;
              min-height: 100vh;
            }
            /* Estilos gerados */
            ${cssContent}
          </style>
        </head>
        <body>
          ${processedHtmlContent}
          <script>
            ${jsContent}
          </script>
        </body>
      </html>
    `
  }

  // Manipula mensagens do iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'navigation') {
        setCurrentPath(event.data.path)
        setSelectedElement(null)
      } else if (event.data.type === 'form') {
        console.log('Dados do formulário:', event.data.data)
      } else if (event.data.type === 'element-select') {
        onElementSelect({
          id: event.data.elementId,
          tagName: event.data.tagName,
          innerText: event.data.innerText,
          blockIndex: event.data.blockIndex,
          propKey: event.data.propKey
        });
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onElementSelect])

  // Atualiza o conteúdo do iframe quando o caminho ou o modo de edição mudam
  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = generateFullHtml(currentPath, isEditMode)
    }
  }, [currentPath, files, isEditMode])

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center border-b p-4">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'desktop' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('desktop')}
          >
            <DesktopIcon className="mr-2 h-4 w-4" />
            Desktop
          </Button>
          <Button
            variant={viewMode === 'mobile' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('mobile')}
          >
            <MobileIcon className="mr-2 h-4 w-4" />
            Mobile
          </Button>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center bg-muted/30">
        <div
          className={`relative h-[calc(94vh-8rem)] ${
            viewMode === 'mobile' ? 'w-[375px]' : 'w-full'
          } overflow-hidden rounded-lg border bg-white shadow-sm transition-all duration-200`}
        >
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              srcDoc={generateFullHtml(currentPath, isEditMode)}
              className="h-full w-full"
              sandbox="allow-scripts allow-same-origin allow-forms"
              title="Preview"
              loading="lazy"
            />
          )}
        </div>
      </div>
    </div>
  )
} 