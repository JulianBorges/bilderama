import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { MemoryVfs } from '@/lib/vfs'
import prettier from 'prettier'

const fileSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
  type: z.enum(['component', 'style', 'script', 'page', 'config']),
  description: z.string().optional()
})

const bodySchema = z.object({
  files: z.array(fileSchema).default([]),
  paths: z.array(z.string().min(1)).optional(),
})

function detectParser(path: string): prettier.BuiltInParserName | undefined {
  if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript'
  if (path.endsWith('.js') || path.endsWith('.jsx')) return 'babel'
  if (path.endsWith('.json')) return 'json'
  if (path.endsWith('.css')) return 'css'
  if (path.endsWith('.md')) return 'markdown'
  if (path.endsWith('.html') || path.endsWith('.hbs')) return 'html'
  return undefined
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload inválido', details: parsed.error.issues }, { status: 400 })
    }

    const vfs = new MemoryVfs(parsed.data.files)
    const targets = new Set(parsed.data.paths && parsed.data.paths.length > 0 ? parsed.data.paths : vfs.list().map(f => f.path))

    for (const path of targets) {
      const file = vfs.read(path)
      if (!file) continue
      const parser = detectParser(path)
      if (!parser) continue
      const formatted = await prettier.format(file.content, { parser })
      vfs.write({ ...file, content: formatted })
    }

    const snap = vfs.snapshot()
    return NextResponse.json({ files: snap.files })
  } catch (err: any) {
    return NextResponse.json({ error: 'Falha ao formatar' }, { status: 500 })
  }
} 