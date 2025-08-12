import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { writeJsonFile, readJsonFile } from '@/lib/persistence/fsdb'

type Snapshot = {
  id: string
  title: string
  prompt: string
  pagePlanJson: string
  chat: { role: 'user' | 'assistant'; content: string; type?: string }[]
  createdAt: string
  isFavorite?: boolean
}

type ProjectRecord = {
  id: string
  name: string
  snapshots: Snapshot[]
  updatedAt: string
}

const bodySchema = z.object({
  id: z.string().min(1),
  snapshot: z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    prompt: z.string().default(''),
    pagePlanJson: z.string().min(2),
    chat: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string(), type: z.string().optional() })),
    createdAt: z.string(),
    isFavorite: z.boolean().optional(),
  })
})

export async function POST(req: NextRequest) {
  try {
    const parsed = bodySchema.parse(await req.json())
    const pid = parsed.id
    const file = `projects/${pid}.json`
    const existing = (await readJsonFile<ProjectRecord>(file)) || { id: pid, name: 'Bilderama', snapshots: [], updatedAt: new Date().toISOString() }
    const snapshots = [parsed.snapshot, ...existing.snapshots].slice(0, 100)
    const record: ProjectRecord = { ...existing, snapshots, updatedAt: new Date().toISOString() }
    await writeJsonFile(file, record)
    return NextResponse.json({ ok: true, snapshots: record.snapshots.length })
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return NextResponse.json({ error: 'Payload inválido', details: err.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Falha ao salvar snapshot' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const id = url.searchParams.get('id') || 'default'
  const file = `projects/${id}.json`
  const data = await readJsonFile<ProjectRecord>(file)
  return NextResponse.json({ project: data })
}

