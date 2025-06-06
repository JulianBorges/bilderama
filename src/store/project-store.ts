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
  setIsEditMode: (isEditMode) => set({ isEditMode: !get().isEditMode }),

  handleCodeGeneration: (response) => {
    set({ generatedFiles: response.files, isGenerating: false });
    if (response.pagePlanJson) {
      try {
        set({ pagePlan: JSON.parse(response.pagePlanJson) });
      } catch (e) {
        console.error("Erro ao fazer parse do PagePlan JSON na store:", e);
        set({ pagePlan: null });
      }
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