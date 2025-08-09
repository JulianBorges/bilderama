import { GeneratedFile } from '@/lib/ai'

type PublishedProject = {
  slug: string
  files: GeneratedFile[]
  createdAt: number
}

const store = new Map<string, PublishedProject>()

function generateSlug(): string {
  // slug curto e legível
  const part = Math.random().toString(36).slice(2, 8)
  const ts = Date.now().toString(36).slice(-4)
  return `${part}${ts}`
}

export function publishFiles(files: GeneratedFile[]): { slug: string } {
  const slug = generateSlug()
  store.set(slug, { slug, files, createdAt: Date.now() })
  return { slug }
}

export function getPublishedFiles(slug: string): GeneratedFile[] | null {
  const entry = store.get(slug)
  if (!entry) return null
  return entry.files
}

export function getPublishedIndexHtml(slug: string): string | null {
  const files = getPublishedFiles(slug)
  if (!files) return null
  const index = files.find(f => f.path === 'index.html') || files.find(f => f.path.endsWith('.html'))
  return index?.content || null
} 