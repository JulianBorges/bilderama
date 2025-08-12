import { GeneratedFile } from '@/lib/ai'
import { readJsonFile, writeJsonFile, dataPath, fileExists } from '@/lib/persistence/fsdb'

type PublishedProject = {
  slug: string
  files: GeneratedFile[]
  createdAt: number
}

const store = new Map<string, PublishedProject>()
const PUBLISHED_DIR = 'published'

function generateSlug(): string {
  // slug curto e legível
  const part = Math.random().toString(36).slice(2, 8)
  const ts = Date.now().toString(36).slice(-4)
  return `${part}${ts}`
}

export function publishFiles(files: GeneratedFile[]): { slug: string } {
  const slug = generateSlug()
  const record: PublishedProject = { slug, files, createdAt: Date.now() }
  store.set(slug, record)
  // persiste em disco (best-effort)
  writeJsonFile(`${PUBLISHED_DIR}/${slug}.json`, record).catch(() => {})
  return { slug }
}

export function getPublishedFiles(slug: string): GeneratedFile[] | null {
  const entry = store.get(slug)
  if (entry) return entry.files
  // tenta carregar do disco
  const file = `${PUBLISHED_DIR}/${slug}.json`
  const loaded = (readJsonFile<PublishedProject>(file) as unknown) as PublishedProject | null
  // Nota: readJsonFile é assíncrono; para não propagar async aqui, checamos sincronia via cache antecipada
  // fallback: se não está em cache, retorna null (rota de página pode não ser SSR). Os endpoints usam versão assíncrona.
  return null
}

export function getPublishedIndexHtml(slug: string): string | null {
  const files = getPublishedFiles(slug)
  if (!files) return null
  const index = files.find(f => f.path === 'index.html') || files.find(f => f.path.endsWith('.html'))
  return index?.content || null
} 

// Versões assíncronas para endpoints
export async function getPublishedFilesAsync(slug: string): Promise<GeneratedFile[] | null> {
  const entry = store.get(slug)
  if (entry) return entry.files
  const file = `${PUBLISHED_DIR}/${slug}.json`
  const loaded = await readJsonFile<PublishedProject>(file)
  if (!loaded) return null
  store.set(slug, loaded)
  return loaded.files
}