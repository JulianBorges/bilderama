import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

const fileSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
  type: z.enum(['component', 'style', 'script', 'page', 'config']).optional(),
  description: z.string().optional()
})

const bodySchema = z.object({ files: z.array(fileSchema).min(1) })

function computeVfsHash(files: { path: string; content: string }[]): string {
  const sorted = files.map(f => ({ path: f.path.replace(/\\/g, '/'), content: f.content })).sort((a, b) => a.path.localeCompare(b.path))
  const json = JSON.stringify(sorted)
  return createHash('sha1').update(json).digest('hex').slice(0, 16)
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload inválido', details: parsed.error.issues }, { status: 400 })
    }

    const files = parsed.data.files
    const hash = computeVfsHash(files)
    const baseDir = path.join(process.cwd(), '.data', 'builds', hash)
    await ensureDir(baseDir)

    // Escreve todos os arquivos conforme VFS
    await Promise.all(files.map(async f => {
      const target = path.join(baseDir, f.path.startsWith('/') ? f.path.slice(1) : f.path)
      await ensureDir(path.dirname(target))
      await fs.writeFile(target, f.content, 'utf8')
    }))

    // Garante um index.html básico se não existir
    const indexPath = path.join(baseDir, 'index.html')
    try { await fs.stat(indexPath) } catch {
      await fs.writeFile(indexPath, '<!doctype html><html><head><meta charset="utf-8"/></head><body><h1>Bilderama</h1></body></html>', 'utf8')
    }

    return NextResponse.json({ ok: true, hash })
  } catch (e: any) {
    return NextResponse.json({ error: 'Falha ao construir artefatos', details: String(e?.message || e) }, { status: 500 })
  }
}

