'use client'

import { useEffect, useRef } from 'react'
import { ChatInterface } from '@/components/chat/chat-interface'
import { PreviewIframe } from '@/components/preview/preview-iframe'
import { CodeViewer } from '@/components/code-viewer/code-viewer'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { SplitPanel } from '@/components/ui/split-panel'
import { Button } from '@/components/ui/button'
import { CodeIcon, EyeOpenIcon, Pencil1Icon } from '@radix-ui/react-icons'
import { DownloadIcon } from 'lucide-react'
import { EditorPanel } from '@/components/editor/editor-panel'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useProjectStore } from '@/store/project-store'

export default function Home() {
  const {
    generatedFiles,
    isGenerating,
    activeView,
    selectedElement,
    isEditMode,
    pagePlan,
    handleCodeGeneration,
    handleElementUpdate,
    setGeneratedFiles,
    setIsGenerating,
    setActiveView,
    setSelectedElement,
    setIsEditMode,
  } = useProjectStore();

  const isInitialGeneration = useRef(true);

  // Efeito para re-gerar o HTML quando o pagePlan muda
  useEffect(() => {
    if (isInitialGeneration.current) {
      isInitialGeneration.current = false;
      return;
    }
    
    if (pagePlan) {
      const rebuildHtml = async () => {
        setIsGenerating(true);
        try {
          const response = await fetch('/api/build', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pagePlan),
          });

          if (!response.ok) throw new Error('Falha ao reconstruir o HTML');

          const { files: newFiles } = await response.json();
          setGeneratedFiles(newFiles);
        } catch (error) {
          console.error("Erro ao reconstruir o HTML:", error);
        } finally {
          setIsGenerating(false);
        }
      };
      rebuildHtml();
    }
  }, [pagePlan, setGeneratedFiles, setIsGenerating]);
  
  const handleDownload = async () => {
    if (generatedFiles.length === 0) return;

    const zip = new JSZip();
    generatedFiles.forEach(file => {
      zip.file(file.path, file.content);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, 'bilderama-site.zip');
  }

  // Wrapper para a função de geração de código para resetar a flag
  const generationHandler = (response: any) => {
    isInitialGeneration.current = true;
    handleCodeGeneration(response);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4">
        <h1 className="text-2xl font-bold">Bilderama</h1>
        <div className="flex items-center gap-4">
          <Button
            variant={isEditMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            className="gap-2"
          >
            <Pencil1Icon className="h-4 w-4" />
            {isEditMode ? 'Sair da Edição' : 'Editar Site'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={generatedFiles.length === 0}
            className="gap-2"
          >
            <DownloadIcon className="h-4 w-4" />
            Download
          </Button>
          <div className="flex items-center rounded-lg border bg-background p-1">
            <Button
              variant={activeView === 'preview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('preview')}
              className="gap-2"
            >
              <EyeOpenIcon className="h-4 w-4" />
              Preview
            </Button>
            <Button
              variant={activeView === 'code' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveView('code')}
              className="gap-2"
            >
              <CodeIcon className="h-4 w-4" />
              Código
            </Button>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1">
        <SplitPanel defaultSplit={40}>
          <div className="flex h-full flex-col rounded-lg border-r bg-background">
            <ChatInterface
              onCodeGeneration={generationHandler}
              onGenerationStart={() => setIsGenerating(true)}
            />
          </div>
          <div className="relative h-full">
            {activeView === 'preview' ? (
              <PreviewIframe 
                files={generatedFiles} 
                isLoading={isGenerating}
                onElementSelect={(el) => {
                  if (el.blockIndex && el.propKey) {
                    setSelectedElement({
                      id: `${el.blockIndex}:${el.propKey}`,
                      tagName: el.tagName,
                      innerText: el.innerText,
                    });
                  }
                }}
                isEditMode={isEditMode}
              />
            ) : (
              <CodeViewer files={generatedFiles} />
            )}
             <EditorPanel
                selectedElement={selectedElement}
                onUpdate={handleElementUpdate}
                onClose={() => setSelectedElement(null)}
              />
          </div>
        </SplitPanel>
      </main>
    </div>
  )
} 