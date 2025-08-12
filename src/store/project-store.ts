import { create } from 'zustand';
import { GeneratedFile, AIResponse } from '@/lib/ai';
import { PagePlan } from '@/lib/schemas';
import type { DiffOperation } from '@/lib/vfs';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  type?: 'prompt' | 'explanation' | 'suggestions' | 'files' | 'error';
}

function saveSnapshot(title: string, prompt: string, pagePlanJson: string, chat: ChatMessage[]) {
  try {
    const raw = localStorage.getItem('bilderama:versions');
    const list = raw ? JSON.parse(raw) : [];
    const snap = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      prompt,
      pagePlanJson,
      chat,
      createdAt: new Date().toISOString(),
      isFavorite: false,
    };
    list.unshift(snap);
    // Limite simples para não crescer infinito
    const limited = list.slice(0, 50);
    localStorage.setItem('bilderama:versions', JSON.stringify(limited));
  } catch (err) {
    console.warn('Falha ao salvar snapshot local:', err);
  }
}

type ActiveView = 'preview' | 'code';

type SelectedElement = {
  id: string; // Formato: "blockIndex:propKey"
  tagName: string;
  innerText: string;
}

interface ProjectState {
  projectName: string;
  generatedFiles: GeneratedFile[];
  isGenerating: boolean;
  activeView: ActiveView;
  selectedElement: SelectedElement | null;
  isEditMode: boolean;
  pagePlan: PagePlan | null;
  lastPrompt: string;
  chatMessages: ChatMessage[];

  // Histórico de diffs aplicados
  previousGeneratedFilesStack: GeneratedFile[][];
  
  // Actions
  handleCodeGeneration: (response: AIResponse) => void;
  handleElementUpdate: (id: string, newContent: string) => void;
  setGeneratedFiles: (files: GeneratedFile[]) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setActiveView: (view: ActiveView) => void;
  setSelectedElement: (element: SelectedElement | null) => void;
  setIsEditMode: (isEditMode: boolean) => void;
  setProjectName: (name: string) => void;
  setLastPrompt: (prompt: string) => void;
  setChatMessages: (msgs: ChatMessage[]) => void;
  addChatMessage: (msg: ChatMessage) => void;
  saveCurrentSnapshot: () => void;
  saveCurrentSnapshotServer: () => Promise<void>;
  resetProject: () => void;

  // Agent/VFS
  applyVfsDiff: (operations: DiffOperation[]) => Promise<void>;
  revertLastChange: () => void;

  // Pré-visualização (sem aplicar)
  previewDiffOnce: (operations: DiffOperation[]) => Promise<{ files: GeneratedFile[]; changedFiles: string[] }>
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  // State
  projectName: 'Bilderama',
  generatedFiles: [],
  isGenerating: false,
  activeView: 'preview',
  selectedElement: null,
  isEditMode: false,
  pagePlan: null,
  lastPrompt: '',
  chatMessages: [],
  previousGeneratedFilesStack: [],

  // Actions
  setGeneratedFiles: (files) => set({ generatedFiles: files }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setActiveView: (view) => set({ activeView: view }),
  setSelectedElement: (element) => set({ selectedElement: element }),
  setIsEditMode: (isEditMode) => set({ isEditMode }),
  setProjectName: (name) => {
    localStorage.setItem('bilderama:project-name', name)
    set({ projectName: name })
  },
  setLastPrompt: (prompt) => set({ lastPrompt: prompt }),
  setChatMessages: (msgs) => set({ chatMessages: msgs }),
  addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
  saveCurrentSnapshot: () => {
    const { pagePlan, lastPrompt, chatMessages } = get();
    if (!pagePlan) return;
    try {
      const json = JSON.stringify(pagePlan);
      const title = pagePlan.pageTitle || 'Projeto';
      saveSnapshot(title, lastPrompt || 'Snapshot manual', json, chatMessages);
    } catch (e) {
      console.warn('Falha ao serializar pagePlan:', e);
    }
  },
  saveCurrentSnapshotServer: async () => {
    const { pagePlan, lastPrompt, chatMessages } = get();
    if (!pagePlan) return;
    try {
      const pagePlanJson = JSON.stringify(pagePlan)
      const snapshot = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: pagePlan.pageTitle || 'Projeto',
        prompt: lastPrompt || 'Snapshot manual',
        pagePlanJson,
        chat: chatMessages,
        createdAt: new Date().toISOString(),
        isFavorite: false,
      }
      await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'default', snapshot }) })
    } catch (e) {
      console.warn('Falha ao salvar snapshot no servidor:', e)
    }
  },
  resetProject: () => {
    localStorage.removeItem('bilderama:project-name')
    set({
      projectName: 'Bilderama',
      generatedFiles: [],
      isGenerating: false,
      activeView: 'preview',
      selectedElement: null,
      isEditMode: false,
      pagePlan: null,
      lastPrompt: '',
      chatMessages: [],
      previousGeneratedFilesStack: [],
    })
  },

  handleCodeGeneration: async (response) => {
    if (!response.pagePlanJson) {
      console.error("A resposta da IA não continha um pagePlanJson.");
      set({ isGenerating: false, generatedFiles: response.files || [] });
      return;
    }

    try {
      const pagePlan: PagePlan = JSON.parse(response.pagePlanJson);
      set({ pagePlan }); // Armazena o plano recebido

      // Salva snapshot local com prompt e chat atuais
      const { lastPrompt, chatMessages } = get();
      const promptForSnapshot = lastPrompt || (response as any).explanation || '';
      saveSnapshot(pagePlan.pageTitle || 'Projeto', promptForSnapshot, response.pagePlanJson, chatMessages);

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

  applyVfsDiff: async (operations) => {
    const { generatedFiles, previousGeneratedFilesStack } = get();
    // Guarda estado anterior para possível reversão
    set({ previousGeneratedFilesStack: [...previousGeneratedFilesStack, generatedFiles], isGenerating: true })
    try {
      const res = await fetch('/api/agent/vfs/apply-diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: generatedFiles, operations })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Falha ao aplicar diffs')
      set({ generatedFiles: data.files, isGenerating: false, activeView: 'code' })
    } catch (err) {
      console.error('Erro ao aplicar diffs na VFS:', err)
      // Reverte o push na pilha caso falhe
      const stack = get().previousGeneratedFilesStack.slice()
      stack.pop()
      set({ previousGeneratedFilesStack: stack, isGenerating: false })
      throw err
    }
  },

  revertLastChange: () => {
    const stack = get().previousGeneratedFilesStack.slice()
    if (stack.length === 0) return
    const previous = stack.pop()!
    set({ generatedFiles: previous, previousGeneratedFilesStack: stack, activeView: 'code' })
  },

  previewDiffOnce: async (operations) => {
    const { generatedFiles } = get()
    const res = await fetch('/api/agent/vfs/apply-diff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: generatedFiles, operations })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'Falha ao pré-visualizar diffs')
    return { files: data.files as GeneratedFile[], changedFiles: data.changedFiles as string[] }
  }
})); 