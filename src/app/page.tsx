'use client'

import { useEffect, useRef } from 'react'
import { ChatInterface } from '@/components/chat/chat-interface'
import { PreviewIframe } from '@/components/preview/preview-iframe'
import { CodeViewer } from '@/components/code-viewer/code-viewer'
import { SplitPanel } from '@/components/ui/split-panel'
import { EditorPanel } from '@/components/editor/editor-panel'
import { useProjectStore } from '@/store/project-store'
import { ChatPanel } from '@/components/chat/chat-panel'

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
          const response = await fetch('/api/render', {
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
  

  // Wrapper para a função de geração de código para resetar a flag
  const generationHandler = (response: any) => {
    isInitialGeneration.current = true;
    handleCodeGeneration(response);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <main className="flex flex-1">
        <SplitPanel defaultSplit={40}>
          <div className="flex h-full flex-col rounded-lg border-r bg-background">
            {/* Painel esquerdo com abas (Chat / Histórico) */}
            <ChatPanel
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