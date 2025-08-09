import { create } from 'zustand';
import { GeneratedFile, AIResponse } from '@/lib/ai';
import { PagePlan } from '@/lib/schemas';

type ActiveView = 'preview' | 'code';

type SelectedElement = {
  id: string; // Formato: "blockIndex:propKey"
  tagName: string;
  innerText: string;
}

interface ProjectState {
  generatedFiles: GeneratedFile[];
  isGenerating: boolean;
  activeView: ActiveView;
  selectedElement: SelectedElement | null;
  isEditMode: boolean;
  pagePlan: PagePlan | null;
  
  // Actions
  handleCodeGeneration: (response: AIResponse) => void;
  handleElementUpdate: (id: string, newContent: string) => void;
  setGeneratedFiles: (files: GeneratedFile[]) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setActiveView: (view: ActiveView) => void;
  setSelectedElement: (element: SelectedElement | null) => void;
  setIsEditMode: (isEditMode: boolean) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  // State
  generatedFiles: [],
  isGenerating: false,
  activeView: 'preview',
  selectedElement: null,
  isEditMode: false,
  pagePlan: null,

  // Actions
  setGeneratedFiles: (files) => set({ generatedFiles: files }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setActiveView: (view) => set({ activeView: view }),
  setSelectedElement: (element) => set({ selectedElement: element }),
  setIsEditMode: (isEditMode) => set({ isEditMode }),

  handleCodeGeneration: async (response) => {
    if (!response.pagePlanJson) {
      console.error("A resposta da IA não continha um pagePlanJson.");
      set({ isGenerating: false, generatedFiles: response.files || [] });
      return;
    }

    try {
      const pagePlan: PagePlan = JSON.parse(response.pagePlanJson);
      set({ pagePlan }); // Armazena o plano recebido

      // Etapa 2: Chamar o renderizador determinístico com o plano.
      const renderResponse = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pagePlan),
      });

      if (!renderResponse.ok) {
        throw new Error('Falha ao renderizar a página a partir do plano.');
      }

      const { files } = await renderResponse.json();
      
      // Etapa 3: Atualizar o estado com os arquivos renderizados.
      set({ generatedFiles: files, isGenerating: false });

    } catch (e) {
      console.error("Erro no fluxo de geração e renderização:", e);
      // Opcional: define um estado de erro para a UI
      set({ isGenerating: false, pagePlan: null });
    }
  },

  handleElementUpdate: (id, newContent) => {
    const { pagePlan } = get();
    if (!pagePlan) return;

    const [blockIndexStr, propKey] = id.split(':');
    const blockIndex = parseInt(blockIndexStr, 10);

    if (isNaN(blockIndex) || !propKey) {
      console.error("ID de elemento malformado na store:", id);
      return;
    }

    const newPagePlan = {
      ...pagePlan,
      blocks: pagePlan.blocks.map((block, index) => {
        if (index === blockIndex) {
          return {
            ...block,
            properties: {
              ...block.properties,
              [propKey]: newContent
            }
          };
        }
        return block;
      })
    };
    
    set({ pagePlan: newPagePlan });
  },
})); 